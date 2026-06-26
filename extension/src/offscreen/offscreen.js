// HackDemo offscreen document — screen recording + frame extraction
let mediaRecorder = null;
let recordedChunks = [];

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type === 'START_RECORDING') {
    startCapture(msg.streamId).then(function () {
      sendResponse({ ok: true });
    }).catch(function (err) {
      sendResponse({ ok: false, error: err.message });
    });
    return true;
  }

  if (msg.type === 'STOP_RECORDING') {
    stopCapture(msg.timestamps || []).then(function (frames) {
      sendResponse({ ok: true, frames: frames });
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
}

async function stopCapture(timestamps) {
  return new Promise(function (resolve) {
    if (!mediaRecorder) { resolve([]); return; }

    mediaRecorder.onstop = async function () {
      var blob = new Blob(recordedChunks, { type: 'video/webm' });
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(function (t) { t.stop(); });
      }

      // Extract frames at given timestamps
      var frames = [];
      if (timestamps.length > 0 && blob.size > 0) {
        frames = await extractFrames(blob, timestamps);
      }
      resolve(frames);
    };

    mediaRecorder.stop();
  });
}

async function extractFrames(videoBlob, timestamps) {
  var url = URL.createObjectURL(videoBlob);
  var video = document.createElement('video');
  video.src = url;
  video.muted = true;

  return new Promise(function (resolve) {
    video.onloadedmetadata = async function () {
      var canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      var ctx = canvas.getContext('2d');

      var frames = [];
      var maxTime = video.duration * 1000; // in ms

      for (var i = 0; i < timestamps.length; i++) {
        var timeMs = timestamps[i];
        if (timeMs > maxTime) timeMs = maxTime;

        // Seek to timestamp
        video.currentTime = timeMs / 1000;

        // Wait for seek to complete
        await new Promise(function (r) {
          video.onseeked = function () { r(null); };
          // Timeout after 2s
          setTimeout(function () { r(null); }, 2000);
        });

        // Draw frame to canvas
        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          var dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          frames.push({ time: timeMs, dataUrl: dataUrl });
        }
      }

      URL.revokeObjectURL(url);
      resolve(frames);
    };

    video.onerror = function () {
      URL.revokeObjectURL(url);
      resolve([]);
    };

    // Start loading
    video.load();
  });
}
