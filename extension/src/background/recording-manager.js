let recordingTabId = null;
let recordingStartTime = 0;
let screenStartTime = 0; // actual wall-clock time when screen recording began
let offscreenReady = false;

export function getRecordingDuration() {
  return Date.now() - recordingStartTime;
}

// ── Offscreen document management ──

async function ensureOffscreen() {
  if (offscreenReady) return;

  // Check if already exists
  const clients = await chrome.offscreen.hasDocument();
  if (!clients) {
    await chrome.offscreen.createDocument({
      url: 'src/offscreen/offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Screen recording for HackDemo',
    });
    // Wait for offscreen to load
    await new Promise(function (r) { return setTimeout(r, 500); });
  }
  offscreenReady = true;
}

async function closeOffscreen() {
  try {
    await chrome.offscreen.closeDocument();
  } catch (_) {}
  offscreenReady = false;
}

// ── Recording ──

export async function startRecording(tabId, startTime) {
  recordingTabId = tabId;
  recordingStartTime = startTime;

  // Start content script tracking
  chrome.tabs.sendMessage(tabId, {
    type: 'START_TRACKING',
    recordingStartTime: startTime,
  }, function (resp) {
    if (chrome.runtime.lastError) {
      console.warn('[HackDemo] sendMessage failed:', chrome.runtime.lastError.message);
    } else {
      console.log('[HackDemo] START_TRACKING acknowledged');
    }
  });
}

// Called when blur fades — starts the actual screen recording
export function getScreenStartTime() { return screenStartTime; }

export async function startScreenCapture() {
  screenStartTime = Date.now();
  try {
    await ensureOffscreen();

    var streamId = await new Promise(function (resolve, reject) {
      chrome.tabCapture.getMediaStreamId({ targetTabId: recordingTabId }, function (id) {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(id);
      });
    });

    await chrome.runtime.sendMessage({
      type: 'START_RECORDING',
      streamId: streamId,
    });
    console.log('[HackDemo] Screen recording started');
  } catch (err) {
    console.warn('[HackDemo] Screen recording failed:', err.message);
  }
}

export async function stopRecording() {
  if (recordingTabId !== null) {
    chrome.tabs.sendMessage(recordingTabId, { type: 'STOP_TRACKING' }, function () {});
  }
  recordingTabId = null;
  recordingStartTime = 0;
}

export function pauseRecording() {
  if (recordingTabId) {
    chrome.tabs.sendMessage(recordingTabId, { type: 'PAUSE_TRACKING' }).catch(function () {});
  }
  chrome.runtime.sendMessage({ type: 'PAUSE_RECORDING' }).catch(function () {});
}

export function resumeRecording() {
  chrome.runtime.sendMessage({ type: 'RESUME_RECORDING' }).catch(function () {});
  if (recordingTabId) {
    chrome.tabs.sendMessage(recordingTabId, { type: 'RESUME_TRACKING' }).catch(function () {});
  }
}

/**
 * Stop recording and extract frames at the given timestamps.
 * @param {number[]} timestamps - ms offsets from recording start
 * @returns {Promise<Array<{ time: number, dataUrl: string }>>}
 */
export async function getData() {
  if (!recordingTabId) throw new Error('No recording tab');
  return new Promise(function (resolve, reject) {
    chrome.tabs.sendMessage(recordingTabId, { type: 'GET_DATA' }, function (resp) {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(resp);
    });
  });
}

export async function getVideoBlob() {
  try {
    var result = await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
    await closeOffscreen();
    return result.dataUrl || null;
  } catch (err) {
    console.warn('[HackDemo] Failed to get video:', err.message);
    await closeOffscreen();
    return null;
  }
}
