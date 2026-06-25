import { state, sendCommand } from './state.js';
import { createStatusBanner } from './components/StatusBanner.js';
import { createRecordingControls } from './components/RecordingControls.js';
import { createStepPreview } from './components/StepPreview.js';
import { createProgressPanel } from './components/ProgressPanel.js';
import { createSettingsPanel } from './components/SettingsPanel.js';

export function render() {
  var root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = '';

  // ── Header ──
  var header = document.createElement('div');
  header.className = 'header';

  var logo = document.createElement('div');
  logo.className = 'header-logo';
  var icon = document.createElement('div');
  icon.className = 'header-icon';
  icon.textContent = 'H';
  logo.appendChild(icon);
  var title = document.createElement('span');
  title.className = 'header-title';
  title.textContent = 'HackDemo';
  logo.appendChild(title);
  header.appendChild(logo);

  var refresh = document.createElement('button');
  refresh.className = 'header-refresh';
  refresh.textContent = state.appState === 'idle' ? 'Refresh' : '';
  refresh.onclick = function () { sendCommand({ type: 'GET_STATUS' }); };
  header.appendChild(refresh);
  root.appendChild(header);

  // ── Status ──
  root.appendChild(createStatusBanner(state.appState, state.error));

  // ── Content ──
  var content = document.createElement('div');
  content.className = 'content';

  if (state.appState === 'idle' || state.appState === 'recording' || state.appState === 'paused') {
    content.appendChild(createRecordingControls(state.appState, state.duration));
  }

  // Processing & completed: show steps + progress
  if ((state.appState === 'processing' || state.appState === 'completed') && state.steps.length > 0) {
    content.appendChild(createStepPreview(state.steps));
  }

  if (state.appState === 'processing') {
    content.appendChild(createProgressPanel('processing', state.progress));
  }

  if (state.appState === 'completed') {
    content.appendChild(createProgressPanel('processing', { phase: 'Complete', percent: 100 }));
  }

  var actions = document.createElement('div');
  actions.className = 'action-buttons';

  // Processing may fail; allow reset
  if (state.appState === 'processing') {
    if (state.demoId) {
      var doneBtn = document.createElement('button');
      doneBtn.className = 'btn btn-done';
      doneBtn.textContent = 'Open Demo Page';
      doneBtn.onclick = function () {
        sendCommand({ type: 'OPEN_RESULT', demoId: state.demoId });
      };
      actions.appendChild(doneBtn);
    }
    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-new';
    cancelBtn.textContent = 'New Recording';
    cancelBtn.onclick = function () { sendCommand({ type: 'CLEAR_SESSION' }); };
    actions.appendChild(cancelBtn);
  }

  if (state.appState === 'completed' && state.demoId) {
    var viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-done';
    viewBtn.textContent = 'View Demo';
    viewBtn.onclick = function () {
      sendCommand({ type: 'OPEN_RESULT', demoId: state.demoId });
    };
    actions.appendChild(viewBtn);

    var newBtn = document.createElement('button');
    newBtn.className = 'btn btn-new';
    newBtn.textContent = 'New Recording';
    newBtn.onclick = function () { sendCommand({ type: 'CLEAR_SESSION' }); };
    actions.appendChild(newBtn);
  }

  if (state.appState === 'error') {
    var resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-secondary';
    resetBtn.textContent = 'Reset';
    resetBtn.onclick = function () { sendCommand({ type: 'CLEAR_SESSION' }); };
    actions.appendChild(resetBtn);
  }

  content.appendChild(actions);
  root.appendChild(content);

  if (state.appState === 'idle') {
    root.appendChild(createSettingsPanel());
  }
}
