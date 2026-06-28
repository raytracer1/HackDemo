import { SESSION_KEY, SETTINGS_KEY, DEFAULT_BACKEND_URL, DEFAULT_FRONTEND_URL, TOKEN_KEY } from '../shared/constants.js';
import { startRecording, startScreenCapture, stopRecording, pauseRecording, resumeRecording, getData, getRecordingDuration, getVideoBlob, closeOffscreen } from './recording-manager.js';
// uploadDemo inline

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

async function updatePopup(event) {
  const user = await getUserInfo();
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'PANEL_UPDATE',
        state: event.state,
        steps: event.steps,
        demoId: event.demoId,
        error: event.error,
        progress: event.progress,
        recordingDuration: event.recordingDuration,
        user: user,
      }).catch(function () {});
    }
  });
}

function updateBadge(count) {
  chrome.action.setBadgeText({ text: String(count) });
  chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
}

function setRecordingIcon(recording) {
  var file = recording ? 'recording.png' : 'normal.png';
  var url = chrome.runtime.getURL('icons/' + file);
  fetch(url).then(function (r) { return r.blob(); }).then(function (blob) {
    return createImageBitmap(blob);
  }).then(function (bitmap) {
    var canvas = new OffscreenCanvas(128, 128);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, 128, 128);
    return ctx.getImageData(0, 0, 128, 128);
  }).then(function (imageData) {
    return chrome.action.setIcon({ imageData: { '128': imageData } });
  }).catch(function (err) {
    console.error('[HackDemo] setIcon error:', err.message);
  });
}

function clearBadge() {
  chrome.action.setBadgeText({ text: '' });
  setRecordingIcon(false);
}

// ── Auth ──

const USER_KEY = 'apiUser';

async function getToken() {
  const result = await chrome.storage.local.get(TOKEN_KEY);
  return result[TOKEN_KEY] || null;
}

async function getUserInfo() {
  const result = await chrome.storage.local.get(USER_KEY);
  return result[USER_KEY] || null;
}

async function saveAuth(token, user) {
  await chrome.storage.local.set({ [TOKEN_KEY]: token, [USER_KEY]: user });
  console.log('[HackDemo] Auth saved:', user.name);
}

async function clearAuth() {
  await chrome.storage.local.remove([TOKEN_KEY, USER_KEY]);
  console.log('[HackDemo] Auth cleared');
}

async function isAuthenticated() {
  const token = await getToken();
  return !!token;
}

// ── Command router ──

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  // Auth token + user info from web app (via content script bridge)
  if (msg.type === 'AUTH_TOKEN') {
    saveAuth(msg.token, msg.user || { name: 'User', email: '' });
    sendResponse({ ok: true });
    return true;
  }

  // Logout from web app
  if (msg.type === 'LOGOUT') {
    clearAuth();
    sendResponse({ ok: true });
    return true;
  }
  if (msg.type === 'START_SCREEN_RECORDING') {
    startScreenCapture().then(function () { sendResponse({ ok: true }); });
    return true;
  }

  if (msg.type === 'STEP_COUNT') {
    updateBadge(msg.count);
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'RECORDING_DATA') {
    handleRecordingData(msg.events, msg.steps).then(function () {
      sendResponse({ ok: true });
    });
    return true;
  }

  handleCommand(msg).then(sendResponse);
  return true;
});

async function handleCommand(cmd) {
  switch (cmd.type) {
    case 'START_RECORDING':   return handleStart(cmd);
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

async function handleStart(cmd) {
  // Require login
  if (!(await isAuthenticated())) {
    return { success: false, error: 'signin_required' };
  }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.id) return { success: false, error: 'No active tab' };

  session = {
    id: crypto.randomUUID(),
    title: tab.title || '',
    tabId: tab.id,
    startTime: Date.now(),
    state: 'recording',
    language: cmd.language || 'English',
    demoType: cmd.demoType || 'product-demo',
  };

  await startRecording(tab.id, session.startTime);
  updateBadge(0);
  setRecordingIcon(true);
  await saveSession();

  updatePopup({ type: 'STATUS_UPDATE', state: 'recording' });
  return { success: true, sessionId: session.id };
}

async function handleDone() {
  console.log('[HackDemo] DONE received');
  const s = await getSession();
  console.log('[HackDemo] Session:', s ? s.state : 'null');
  if (!s || (s.state !== 'recording' && s.state !== 'paused')) return { success: false };

  s.state = 'processing';
  session = s;
  await saveSession();
  clearBadge();
  updatePopup({ type: 'STATUS_UPDATE', state: 'processing' });

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

async function handleRecordingData(rawEvents, rawSteps) {
  const s = session;
  if (!s) return;

  console.log('[HackDemo] Received', rawSteps.length, 'steps with', rawEvents.length, 'events');

  // Build steps immediately
  const steps = rawSteps.filter(function (rs) { return rs.events && rs.events.length > 0; }).map(function (rs, i) {
    return {
      index: i, events: rs.events,
      startTime: rs.events[0] ? rs.events[0].timestamp : 0,
      endTime: rs.events[rs.events.length - 1] ? rs.events[rs.events.length - 1].timestamp : 0,
      stableTime: rs.stableTime || null,
      description: rs.description || autoDescribe(rs.events),
      actionType: autoClassify(rs.events),
      highlights: rs.highlights || [],
      pageContext: { title: rs.events[rs.events.length - 1]?.pageTitle || '', url: rs.events[rs.events.length - 1]?.url || '' },
    };
  });

  s.steps = steps;
  session = s;
  clearBadge();
  // Close panel immediately, don't show upload progress
  updatePopup({ type: 'STATUS_UPDATE', state: 'idle' });

  // Create demo + open tab immediately (before frame extraction)
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const backendUrl = (stored[SETTINGS_KEY] && stored[SETTINGS_KEY].backendUrl) || DEFAULT_BACKEND_URL;
  const frontendUrl = DEFAULT_FRONTEND_URL;

  try {
    // Include API token if user has logged in on the web app
    var token = await getToken();
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    var createResp = await fetch(backendUrl + '/api/demos', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ title: 'Demo ' + new Date().toLocaleString(), steps: steps, language: s.language, demoType: s.demoType }),
    });
    var createData = await createResp.json();
    var demoId = createData.id;
    chrome.tabs.create({ url: frontendUrl + '/demo/' + demoId });
    console.log('[HackDemo] Tab opened for', demoId);

    // Now: 1s delay → getFrames → upload screenshots in background
    // 1s delay → get video → upload to R2
    await new Promise(function (r) { return setTimeout(r, 1000); });
    var videoDataUrl = await getVideoBlob();
    console.log('[HackDemo] Video blob:', videoDataUrl ? 'got ' + Math.round(videoDataUrl.length / 1024) + ' KB' : 'NULL');

    if (videoDataUrl && createData.videoUploadUrl) {
      try {
        var resp = await fetch(videoDataUrl);
        var blob = await resp.blob();
        console.log('[HackDemo] Uploading video, size:', Math.round(blob.size / 1024), 'KB');
        var putResp = await fetch(createData.videoUploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'video/webm' } });
        console.log('[HackDemo] Video upload status:', putResp.status);
      } catch (err) {
        console.error('[HackDemo] Video upload failed:', err.message);
      }
    } else {
      console.warn('[HackDemo] Missing videoDataUrl or uploadUrl');
    }

    // Confirm
    var confirmResp = await fetch(backendUrl + '/api/demos/' + demoId + '/confirm', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    console.log('[HackDemo] Confirm status:', confirmResp.status);
  } catch (err) {
    console.error('[HackDemo] Create demo failed:', err.message);
  }

  session = null;
  await chrome.storage.session.remove(SESSION_KEY);
  updatePopup({ type: 'STATUS_UPDATE', state: 'idle' });
}


function autoDescribe(events) {
  if (!events || events.length === 0) return '';
  if (events.length === 1) {
    var e = events[0];
    if (e.type === 'lifecycle') return e.description || e.elementText || e.type;
    switch (e.type) {
      case 'click':      return 'Clicked "' + e.elementText + '"';
      case 'input':      return 'Entered text in "' + e.elementText + '"';
      case 'submit':     return 'Submitted form';
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
  if (types.has('click')) return 'click';
  return 'mixed';
}

async function handlePause() {
  const s = await getSession();
  if (!s || s.state !== 'recording') return { success: false };
  s.state = 'paused';
  session = s;
  pauseRecording();
  await saveSession();
  updatePopup({ type: 'STATUS_UPDATE', state: 'paused' });
  return { success: true };
}

async function handleResume() {
  const s = await getSession();
  if (!s || s.state !== 'paused') return { success: false };
  s.state = 'recording';
  session = s;
  resumeRecording();
  await saveSession();
  updatePopup({ type: 'STATUS_UPDATE', state: 'recording' });
  return { success: true };
}

async function handleDelete() {
  const s = await getSession();
  if (!s || (s.state !== 'recording' && s.state !== 'paused')) return { success: false };
  stopRecording();
  try { await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' }); } catch (_) {}
  try { await closeOffscreen(); } catch (_) {}
  session = null;
  clearBadge();
  await chrome.storage.session.remove(SESSION_KEY);
  updatePopup({ type: 'STATUS_UPDATE', state: 'idle' });
  return { success: true };
}

async function handleStatus() {
  const s = await getSession();
  const user = await getUserInfo();
  if (!s) {
    updatePopup({ type: 'STATUS_UPDATE', state: 'idle', user: user });
    return { state: 'idle', user: user };
  }
  updatePopup({
    type: 'STATUS_UPDATE',
    state: s.state,
    recordingDuration: s.state === 'recording' ? getRecordingDuration() : undefined,
    user: user,
  });
  if (s.steps && s.steps.length > 0) {
    updatePopup({ type: 'STEPS_READY', steps: s.steps });
  }
  return { state: s.state, user: user };
}

async function handleClear() {
  session = null;
  clearBadge();
  await chrome.storage.session.remove(SESSION_KEY);
  updatePopup({ type: 'STATUS_UPDATE', state: 'idle' });
  return { success: true };
}

// ── Extension icon clicked → toggle panel ──

chrome.action.onClicked.addListener(async function (tab) {
  try {
    const authed = await isAuthenticated();
    console.log('[HackDemo] Icon clicked, authenticated:', authed);

    if (!authed) {
      const loginUrl = DEFAULT_FRONTEND_URL + '/login';
      console.log('[HackDemo] Opening login page:', loginUrl);
      const newTab = await chrome.tabs.create({ url: loginUrl });
      console.log('[HackDemo] Login tab created:', newTab.id);
      return;
    }

    if (!tab.id) return;
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
  } catch (err) {
    console.error('[HackDemo] onClick error:', err.message);
  }
});

// ── Install onboarding ──

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    console.log('[HackDemo] First install — opening login page');
    chrome.tabs.create({ url: DEFAULT_FRONTEND_URL + '/login' });
  }
});

// ── Keep-alive ──

setInterval(function () {
  chrome.storage.local.get('keepAlive', function () {});
}, 20000);
