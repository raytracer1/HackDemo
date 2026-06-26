let recordingTabId = null;
let recordingStartTime = 0;
let offscreenReady = false;
let pauseStartTime = 0;
let totalPauseMs = 0;

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

  // Start offscreen screen recording
  try {
    await ensureOffscreen();

    // Get stream ID for the target tab
    var streamId = await new Promise(function (resolve, reject) {
      chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, function (id) {
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
  pauseStartTime = Date.now();
  chrome.runtime.sendMessage({ type: 'PAUSE_RECORDING' }).catch(function () {});
}

export function resumeRecording() {
  totalPauseMs += Date.now() - pauseStartTime;
  chrome.runtime.sendMessage({ type: 'RESUME_RECORDING' }).catch(function () {});
}

export function getPauseOffset() {
  return totalPauseMs;
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

export async function getFrames(timestamps) {
  // Adjust timestamps: video time excludes paused duration
  var offset = totalPauseMs;
  var adjustedTimestamps = timestamps.map(function (t) { return Math.max(0, t - offset); });

  try {
    var result = await chrome.runtime.sendMessage({
      type: 'STOP_RECORDING',
      timestamps: adjustedTimestamps,
    });
    await closeOffscreen();
    return result.frames || [];
  } catch (err) {
    console.warn('[HackDemo] Failed to get frames:', err.message);
    await closeOffscreen();
    return [];
  }
}
