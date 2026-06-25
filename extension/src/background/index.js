import { SESSION_KEY, SETTINGS_KEY, STEP_MERGE_WINDOW_MS } from '../shared/constants.js';
import { startRecording, stopRecording, getRecordingDuration, captureScreenshot } from './recording-manager.js';
import { generateSteps } from './step-generator.js';
import { uploadDemo } from './api-client.js';

// ── state ──

/** @type {Object|null} */
let session = null;
/** @type {number} timestamp of last screenshot */
let lastScreenshotTime = 0;

async function getSession() {
  if (session) return session;
  const result = await chrome.storage.session.get(SESSION_KEY);
  if (result[SESSION_KEY]) {
    session = result[SESSION_KEY];
    return session;
  }
  return null;
}

async function saveSession() {
  if (session) {
    await chrome.storage.session.set({ [SESSION_KEY]: session });
  }
}

/** @param {Object} event */
function updatePopup(event) {
  chrome.runtime.sendMessage(event).catch(function () {});
}

// ── Screenshot capture ──

/**
 * Take a screenshot and store it in the session with timestamp.
 */
async function takeScreenshot() {
  try {
    const dataUrl = await captureScreenshot();
    const elapsed = Date.now() - session.startTime;
    session.screenshots.push({ time: elapsed, dataUrl: dataUrl });
    lastScreenshotTime = elapsed;
    await saveSession();
  } catch (err) {
    console.warn('[HackDemo] Screenshot failed:', err.message);
  }
}

/**
 * Check if a new screenshot should be taken based on the incoming event.
 * @param {Object} event
 * @returns {boolean}
 */
function shouldScreenshot(event) {
  // Always screenshot on navigation and submit
  if (event.type === 'navigation' || event.type === 'page_load' || event.type === 'submit') {
    return true;
  }
  // Screenshot on click if enough time has passed since last screenshot
  if (event.type === 'click') {
    const elapsed = event.timestamp;
    if (elapsed - lastScreenshotTime > STEP_MERGE_WINDOW_MS) {
      return true;
    }
  }
  return false;
}

// ── command router ──

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  handleCommand(msg).then(sendResponse);
  return true;
});

async function handleCommand(cmd) {
  switch (cmd.type) {
    case 'START_RECORDING': return handleStart();
    case 'STOP_RECORDING':  return handleStop();
    case 'GET_STATUS':      return handleStatus();
    case 'UPLOAD_DEMO':     return handleUpload(cmd.title);
    case 'OPEN_RESULT':     return handleOpen(cmd.demoId);
    case 'CLEAR_SESSION':   return handleClear();
    default: return { success: false };
  }
}

// ── handlers ──

async function handleStart() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.id) return { success: false, error: 'No active tab' };

  const id = crypto.randomUUID();
  session = {
    id: id,
    title: tab.title || '',
    tabId: tab.id,
    startTime: Date.now(),
    events: [],
    steps: [],
    screenshots: [],
    state: 'recording',
  };
  lastScreenshotTime = 0;

  await startRecording(tab.id, session.startTime);

  // Take initial screenshot after a short delay (let page settle)
  setTimeout(function () { takeScreenshot(); }, 500);

  await saveSession();
  updatePopup({ type: 'STATUS_UPDATE', state: 'recording', recordingDuration: 0 });
  return { success: true, sessionId: id };
}

async function handleStop() {
  const s = await getSession();
  if (!s || s.state !== 'recording') return { success: false };

  // Take final screenshot before stopping
  await takeScreenshot();
  await stopRecording();

  // Generate steps
  const steps = generateSteps(s.events, s.screenshots);
  s.steps = steps;
  s.state = 'steps_review';
  session = s;
  await saveSession();

  updatePopup({ type: 'STEPS_READY', steps: steps });
  return { success: true };
}

async function handleStatus() {
  const s = await getSession();
  if (!s) {
    updatePopup({ type: 'STATUS_UPDATE', state: 'idle' });
    return { state: 'idle' };
  }

  updatePopup({
    type: 'STATUS_UPDATE',
    state: s.state,
    recordingDuration: s.state === 'recording' ? getRecordingDuration() : undefined,
  });

  if (s.steps.length > 0) {
    updatePopup({ type: 'STEPS_READY', steps: s.steps });
  }

  return { state: s.state };
}

async function handleUpload(title) {
  const s = await getSession();
  if (!s || s.steps.length === 0) return { success: false };

  s.state = 'uploading';
  s.title = title;
  session = s;
  await saveSession();
  updatePopup({ type: 'STATUS_UPDATE', state: 'uploading' });

  try {
    const stored = await chrome.storage.local.get(SETTINGS_KEY);
    const backendUrl = (stored[SETTINGS_KEY] && stored[SETTINGS_KEY].backendUrl) || 'http://localhost:3001';

    updatePopup({ type: 'UPLOAD_PROGRESS', phase: 'uploading', percent: 20 });

    // Extract screenshot data URLs for upload
    const screenshotDataUrls = s.screenshots.map(function (s) { return s.dataUrl; });

    const result = await uploadDemo(backendUrl, {
      title: s.title,
      steps: s.steps,
      screenshots: screenshotDataUrls,
    });

    session.demoId = result.id;
    session.state = 'processing';
    await saveSession();

    updatePopup({ type: 'UPLOAD_COMPLETE', demoId: result.id });
    pollProcessing(backendUrl, result.id);

    return { success: true, demoId: result.id };
  } catch (err) {
    session.state = 'error';
    session.error = err.message;
    await saveSession();
    updatePopup({ type: 'ERROR', message: err.message });
    return { success: false, error: err.message };
  }
}

async function handleOpen(demoId) {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const backendUrl = (stored[SETTINGS_KEY] && stored[SETTINGS_KEY].backendUrl) || 'http://localhost:3001';
  const frontendUrl = backendUrl.replace('localhost:3001', 'localhost:5173');

  await chrome.tabs.create({
    url: frontendUrl + '/#/demo/' + demoId,
  });
}

async function handleClear() {
  session = null;
  await chrome.storage.session.remove(SESSION_KEY);
  updatePopup({ type: 'STATUS_UPDATE', state: 'idle' });
  return { success: true };
}

// ── Polling ──

async function pollProcessing(backendUrl, demoId) {
  for (let i = 0; i < 60; i++) {
    await new Promise(function (r) { return setTimeout(r, 3000); });

    try {
      const resp = await fetch(backendUrl + '/api/demos/' + demoId);
      const demo = await resp.json();

      if (demo.status === 'completed') {
        updatePopup({ type: 'PROCESSING_COMPLETE', demo: demo });
        if (session) { session.state = 'completed'; await saveSession(); }
        return;
      }

      if (demo.status === 'failed') {
        updatePopup({ type: 'ERROR', message: 'Processing failed on server' });
        if (session) { session.state = 'error'; session.error = 'Processing failed'; await saveSession(); }
        return;
      }

      updatePopup({ type: 'PROCESSING_UPDATE', status: demo.status });
    } catch (_) { /* retry */ }
  }

  updatePopup({ type: 'ERROR', message: 'Processing timed out' });
}

// ── Content script port ──
// Buffer events and trigger screenshots at step boundaries

chrome.runtime.onConnect.addListener(function (port) {
  if (port.name === 'content-events') {
    port.onMessage.addListener(async function (msg) {
      if (msg.type === 'EVENT_RECORDED' && session && session.state === 'recording') {
        const event = msg.event;

        // Filter noise
        if (event.elementRole === 'body' || event.elementRole === 'html') return;
        if (!event.elementText && event.type !== 'navigation' && event.type !== 'page_load') return;

        // Store event
        session.events.push(event);

        // Take screenshot at boundaries
        if (shouldScreenshot(event)) {
          await takeScreenshot();
        }

        await saveSession();
      }
    });
  }
});

// ── Keep-alive ──

setInterval(function () {
  chrome.storage.local.get('keepAlive', function () {});
}, 20000);
