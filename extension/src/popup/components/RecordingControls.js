import { sendCommand } from '../state.js';

/**
 * @param {number} ms
 * @returns {string}
 */
function formatTime(ms) {
  var sec = Math.floor(ms / 1000);
  var min = Math.floor(sec / 60);
  var s = sec % 60;
  return String(min).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

/**
 * @param {string} state
 * @param {number} duration
 * @returns {HTMLElement}
 */
export function createRecordingControls(state, duration) {
  var container = document.createElement('div');
  container.style.cssText = 'text-align:center;padding:16px 0;';

  var isRecording = state === 'recording';

  // Timer
  if (isRecording) {
    var timer = document.createElement('div');
    timer.className = 'timer-display';
    timer.textContent = formatTime(duration);
    container.appendChild(timer);
  }

  // Buttons
  var btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:12px;justify-content:center;margin-top:12px;';
  container.appendChild(btnRow);

  if (!isRecording) {
    var btn = document.createElement('button');
    btn.className = 'btn btn-start';
    btn.style.width = 'auto';
    btn.style.paddingLeft = '20px';
    btn.style.paddingRight = '20px';
    btn.disabled = state !== 'idle';

    var dot = document.createElement('span');
    dot.className = 'btn-start-record-dot';
    btn.appendChild(dot);
    btn.appendChild(document.createTextNode('Start Recording'));
    btn.onclick = function () { sendCommand({ type: 'START_RECORDING' }); };
    btnRow.appendChild(btn);
  } else {
    var btn = document.createElement('button');
    btn.className = 'btn btn-stop';
    btn.style.width = 'auto';
    btn.style.paddingLeft = '20px';
    btn.style.paddingRight = '20px';

    var sq = document.createElement('span');
    sq.className = 'btn-stop-square';
    btn.appendChild(sq);
    btn.appendChild(document.createTextNode('Stop Recording'));
    btn.onclick = function () { sendCommand({ type: 'STOP_RECORDING' }); };
    btnRow.appendChild(btn);
  }

  return container;
}
