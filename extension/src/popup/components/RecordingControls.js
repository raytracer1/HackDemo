import { sendCommand } from '../state.js';

export function createRecordingControls(state, duration) {
  var container = document.createElement('div');
  container.style.cssText = 'text-align:center;padding:16px 0;';

  var isRecording = state === 'recording';
  var isPaused = state === 'paused';

  var btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap;';
  container.appendChild(btnRow);

  if (!isRecording && !isPaused) {
    // Idle: Start button
    var btn = document.createElement('button');
    btn.className = 'btn btn-start';
    btn.style.cssText = 'width:auto;padding:10px 24px;';
    btn.disabled = state !== 'idle';

    var dot = document.createElement('span');
    dot.className = 'btn-start-record-dot';
    btn.appendChild(dot);
    btn.appendChild(document.createTextNode('Start'));
    btn.onclick = function () { sendCommand({ type: 'START_RECORDING' }); };
    btnRow.appendChild(btn);
  } else {
    // Recording/Paused: Pause/Resume + Delete + Done

    // Pause / Resume
    var pauseBtn = document.createElement('button');
    pauseBtn.className = 'btn btn-secondary';
    pauseBtn.style.cssText = 'width:auto;padding:8px 16px;font-size:12px;';
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    pauseBtn.onclick = function () {
      sendCommand({ type: isPaused ? 'RESUME_RECORDING' : 'PAUSE_RECORDING' });
    };
    btnRow.appendChild(pauseBtn);

    // Delete
    var delBtn = document.createElement('button');
    delBtn.className = 'btn btn-secondary';
    delBtn.style.cssText = 'width:auto;padding:8px 16px;font-size:12px;border-color:#ef4444;color:#fca5a5;';
    delBtn.textContent = 'Delete';
    delBtn.onclick = function () {
      if (confirm('Discard this recording?')) {
        sendCommand({ type: 'DELETE_RECORDING' });
      }
    };
    btnRow.appendChild(delBtn);

    // Done
    if (isRecording) {
      var doneBtn = document.createElement('button');
      doneBtn.className = 'btn btn-done';
      doneBtn.style.cssText = 'width:auto;padding:8px 16px;font-size:12px;';
      doneBtn.textContent = 'Done';
      doneBtn.onclick = function () { sendCommand({ type: 'DONE_RECORDING' }); };
      btnRow.appendChild(doneBtn);
    }
  }

  return container;
}
