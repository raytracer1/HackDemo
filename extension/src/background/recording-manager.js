let recordingTabId = null;
let recordingStartTime = 0;

/**
 * @returns {number} elapsed ms since recording started
 */
export function getRecordingDuration() {
  return Date.now() - recordingStartTime;
}

/**
 * @returns {number|null}
 */
export function getRecordingTabId() {
  return recordingTabId;
}

/**
 * Take a screenshot of the current tab.
 * @returns {Promise<string>} data URL of the screenshot
 */
export function captureScreenshot() {
  return new Promise(function (resolve, reject) {
    if (recordingTabId === null) {
      reject(new Error('No recording tab'));
      return;
    }
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(dataUrl);
    });
  });
}

/**
 * @param {number} tabId
 * @param {number} startTime
 */
export async function startRecording(tabId, startTime) {
  recordingTabId = tabId;
  recordingStartTime = startTime;

  try {
    await chrome.tabs.sendMessage(tabId, {
      type: 'START_TRACKING',
      recordingStartTime: startTime,
    });
  } catch (err) {
    console.warn('[HackDemo] Content script not yet injected:', err.message);
  }
}

export async function stopRecording() {
  if (recordingTabId === null) return;

  try {
    await chrome.tabs.sendMessage(recordingTabId, { type: 'STOP_TRACKING' });
  } catch (_) {
    // content script may already be gone
  }

  recordingTabId = null;
  recordingStartTime = 0;
}
