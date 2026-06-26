import { SESSION_KEY, SETTINGS_KEY, DEFAULT_BACKEND_URL, DEFAULT_FRONTEND_URL } from '../shared/constants.js';
import { startRecording, stopRecording, getData, getRecordingDuration } from './recording-manager.js';
import { generateSteps } from './step-generator.js';
import { uploadDemo } from './api-client.js';

// ── state ──

let session = null;

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

function updatePopup(event) {
  chrome.runtime.sendMessage(event).catch(function () {});
}

function updateBadge(count) {
  chrome.action.setBadgeText({ text: String(count) });
  chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
}

function clearBadge() {
  chrome.action.setBadgeText({ text: '' });
}

// ── Command router ──

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  // Screenshot request from content script
  if (msg.type === 'CAPTURE') {
    handleCapture().then(function () {
      sendResponse({ ok: true });
    });
    return true;
  }

  // Step count update from content script
  if (msg.type === 'STEP_COUNT') {
    updateBadge(msg.count);
    sendResponse({ ok: true });
    return true;
  }

  // RECORDING_DATA from content script
  if (msg.type === 'RECORDING_DATA') {
    handleRecordingData(msg.events, msg.steps).then(function () {
      sendResponse({ ok: true });
    });
    return true;
  }

  // Commands from popup
  handleCommand(msg).then(sendResponse);
  return true;
});

async function handleCommand(cmd) {
  switch (cmd.type) {
    case 'START_RECORDING':   return handleStart();
    case 'DONE_RECORDING':    return handleDone();
    case 'PAUSE_RECORDING':   return handlePause();
    case 'RESUME_RECORDING':  return handleResume();
    case 'DELETE_RECORDING':  return handleDelete();
    case 'GET_STATUS':        return handleStatus();
    case 'CLEAR_SESSION':     return handleClear();
    default: return { success: false };
  }
}

// ── Handlers ──

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
    state: 'recording',
  };

  startRecording(tab.id, session.startTime);
  updateBadge(0);
  await saveSession();

  updatePopup({ type: 'STATUS_UPDATE', state: 'recording' });
  return { success: true, sessionId: id };
}

async function handleDone() {
  const s = await getSession();
  if (!s || s.state !== 'recording') return { success: false };

  s.state = 'processing';
  session = s;
  await saveSession();
  clearBadge();
  updatePopup({ type: 'STATUS_UPDATE', state: 'processing' });

  // Get data from content script
  try {
    await getData();
  } catch (err) {
    console.error('[HackDemo] Failed to get data from content:', err.message);
    session.state = 'error';
    session.error = err.message;
    await saveSession();
    updatePopup({ type: 'ERROR', message: err.message });
    return { success: false };
  }

  return { success: true };
}

async function handleCapture() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0] || !tabs[0].id) return;

  chrome.tabs.captureVisibleTab(tabs[0].windowId, { format: 'png' }, function (dataUrl) {
    if (chrome.runtime.lastError) {
      console.warn('[HackDemo] captureVisibleTab failed:', chrome.runtime.lastError.message);
      return;
    }
    if (session) {
      session.screenshots = session.screenshots || [];
      session.screenshots.push(dataUrl);
      saveSession();
    }
  });
}

async function handleRecordingData(rawEvents, rawSteps) {
  const s = session;
  if (!s) return;

  console.log('[HackDemo] Received', rawSteps.length, 'steps with', rawEvents.length, 'events');

  // Convert raw steps to DemoStep format
  const steps = [];
  const screenshots = [];

  for (let i = 0; i < rawSteps.length; i++) {
    const rs = rawSteps[i];
    const startTime = rs.events[0] ? rs.events[0].timestamp : 0;
    const endTime = rs.events[rs.events.length - 1] ? rs.events[rs.events.length - 1].timestamp : 0;

    // Match screenshot from background captures (by index)
    const screenshot = (s.screenshots && s.screenshots[i]) ? s.screenshots[i] : null;

    steps.push({
      index: i,
      events: rs.events,
      startTime: startTime,
      endTime: endTime,
      description: autoDescribe(rs.events),
      actionType: autoClassify(rs.events),
      screenshot: screenshot,
      highlights: rs.highlights || [],
      pageContext: {
        title: rs.events[rs.events.length - 1]?.pageTitle || '',
        url: rs.events[rs.events.length - 1]?.url || '',
      },
    });

    if (screenshot) {
      screenshots.push(screenshot);
    }
  }

  s.steps = steps;
  s.screenshots = screenshots;
  session = s;
  await saveSession();

  clearBadge();
  // Keep state as 'processing', don't send STEPS_READY
  updatePopup({ type: 'STATUS_UPDATE', state: 'processing' });

  // Fire upload in background, reset to idle immediately
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const backendUrl = (stored[SETTINGS_KEY] && stored[SETTINGS_KEY].backendUrl) || DEFAULT_BACKEND_URL;
  const frontendUrl = DEFAULT_FRONTEND_URL;

  uploadDemo(backendUrl, {
    title: 'Demo ' + new Date().toLocaleString(),
    steps: steps,
    screenshots: screenshots,
  }).then(function (result) {
    return chrome.tabs.create({ url: frontendUrl + '/#/demo/' + result.id });
  }).catch(function (err) {
    console.error('[HackDemo] Upload failed:', err.message);
  });

  // Reset to idle immediately
  session = null;
  await chrome.storage.session.remove(SESSION_KEY);
  updatePopup({ type: 'STATUS_UPDATE', state: 'idle' });
}

// Simple descriptions (same logic as step-generator, simplified)
function autoDescribe(events) {
  if (events.length === 0) return 'Unknown action';
  if (events.length === 1) {
    var e = events[0];
    switch (e.type) {
      case 'click':      return 'Clicked "' + e.elementText + '"';
      case 'input':      return 'Entered text in "' + e.elementText + '"';
      case 'submit':     return 'Submitted form';
      case 'navigation': return 'Navigated to ' + e.pageTitle;
      case 'page_load':  return 'Loaded ' + e.pageTitle;
      default: return e.type;
    }
  }
  var clicks = events.filter(function (e) { return e.type === 'click'; });
  var inputs = events.filter(function (e) { return e.type === 'input'; });
  if (inputs.length > 0 && clicks.length > 0) {
    return 'Filled in ' + inputs.length + ' fields and clicked "' + clicks[clicks.length - 1].elementText + '"';
  }
  if (clicks.length === events.length) return 'Clicked ' + clicks.length + ' elements';
  return 'Performed ' + events.length + ' actions';
}

function autoClassify(events) {
  var types = new Set(events.map(function (e) { return e.type; }));
  if (types.has('submit')) return 'form_submit';
  if (types.has('input')) return 'form_fill';
  if (types.has('navigation') || types.has('page_load')) return 'navigation';
  if (types.has('click')) return 'click';
  return 'mixed';
}

async function handlePause() {
  const s = await getSession();
  if (!s || s.state !== 'recording') return { success: false };
  s.state = 'paused';
  session = s;
  await saveSession();
  updatePopup({ type: 'STATUS_UPDATE', state: 'paused' });
  return { success: true };
}

async function handleResume() {
  const s = await getSession();
  if (!s || s.state !== 'paused') return { success: false };
  s.state = 'recording';
  session = s;
  await saveSession();
  updatePopup({ type: 'STATUS_UPDATE', state: 'recording' });
  return { success: true };
}

async function handleDelete() {
  stopRecording();
  session = null;
  clearBadge();
  await chrome.storage.session.remove(SESSION_KEY);
  updatePopup({ type: 'STATUS_UPDATE', state: 'idle' });
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
  if (s.steps && s.steps.length > 0) {
    updatePopup({ type: 'STEPS_READY', steps: s.steps });
  }
  return { state: s.state };
}

async function handleClear() {
  session = null;
  clearBadge();
  await chrome.storage.session.remove(SESSION_KEY);
  updatePopup({ type: 'STATUS_UPDATE', state: 'idle' });
  return { success: true };
}

// ── Keep-alive ──

setInterval(function () {
  chrome.storage.local.get('keepAlive', function () {});
}, 20000);
