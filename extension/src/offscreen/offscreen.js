// HackDemo offscreen document — screen recording + frame extraction
let mediaRecorder = null;
let recordedChunks = [];

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type === 'START_RECORDING') {
    startCapture(msg.streamId).then(function (actualStartTime) {
      sendResponse({ ok: true, actualStartTime: actualStartTime });
    }).catch(function (err) {
      sendResponse({ ok: false, error: err.message });
    });
    return true;
  }

  if (msg.type === 'STOP_RECORDING') {
    stopCapture().then(function (dataUrl) {
      sendResponse({ ok: true, dataUrl: dataUrl });
    });
    return true;
  }

  if (msg.type === 'PAUSE_RECORDING') {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
    }
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'RESUME_RECORDING') {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
    }
    sendResponse({ ok: true });
    return true;
  }
});

async function startCapture(streamId) {
  recordedChunks = [];

  try {
    var stream = await navigator.mediaDevices.getUserMedia({
      video: {
        mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId },
      },
      audio: false,
    });
  } catch (e) {
    stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
  }

  mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

  mediaRecorder.ondataavailable = function (event) {
    if (event.data.size > 0) recordedChunks.push(event.data);
  };

  mediaRecorder.start(1000);
  return Date.now();
}

async function stopCapture() {
  return new Promise(function (resolve) {
    if (!mediaRecorder) { resolve(null); return; }

    mediaRecorder.onstop = function () {
      var blob = new Blob(recordedChunks, { type: 'video/webm' });
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(function (t) { t.stop(); });
      }
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.readAsDataURL(blob);
    };

    mediaRecorder.stop();
  });
}
