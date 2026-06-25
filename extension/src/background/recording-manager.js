let recordingTabId = null;
let recordingStartTime = 0;

export function getRecordingDuration() {
  return Date.now() - recordingStartTime;
}

export function startRecording(tabId, startTime) {
  recordingTabId = tabId;
  recordingStartTime = startTime;

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

export async function getData() {
  if (!recordingTabId) throw new Error('No recording tab');

  return new Promise(function (resolve, reject) {
    chrome.tabs.sendMessage(recordingTabId, { type: 'GET_DATA' }, function (resp) {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(resp);
      }
    });
  });
}

export function stopRecording() {
  if (recordingTabId !== null) {
    chrome.tabs.sendMessage(recordingTabId, { type: 'STOP_TRACKING' }, function () {});
  }
  recordingTabId = null;
  recordingStartTime = 0;
}
