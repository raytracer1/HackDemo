import { state, sendCommand } from './state.js';
import { createStatusBanner } from './components/StatusBanner.js';
import { createRecordingControls } from './components/RecordingControls.js';
import { createStepPreview } from './components/StepPreview.js';
import { createProgressPanel } from './components/ProgressPanel.js';
import { createSettingsPanel } from './components/SettingsPanel.js';

/**
 * Full re-render of the popup UI.
 * Called whenever state changes.
 */
export function render() {
  var root = document.getElementById('root');
  if (!root) return;

  // Clear
  root.innerHTML = '';

  // Header
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

  // Status banner
  root.appendChild(createStatusBanner(state.appState, state.error));

  // Content
  var content = document.createElement('div');
  content.className = 'content';

  // Recording controls
  if (state.appState === 'idle' || state.appState === 'recording') {
    content.appendChild(createRecordingControls(state.appState, state.duration));
  }

  // Steps preview
  if ((state.appState === 'steps_review' || state.appState === 'completed') && state.steps.length > 0) {
    content.appendChild(createStepPreview(state.steps));
  }

  // Progress
  if (state.appState === 'uploading' || state.appState === 'processing') {
    content.appendChild(createProgressPanel(state.appState, state.progress));
  }

  // Action buttons
  var actions = document.createElement('div');
  actions.className = 'action-buttons';

  if (state.appState === 'steps_review') {
    var uploadBtn = document.createElement('button');
    uploadBtn.className = 'btn btn-upload';
    uploadBtn.textContent = 'Upload & Generate Demo';
    uploadBtn.onclick = function () {
      sendCommand({ type: 'UPLOAD_DEMO', title: 'Demo ' + new Date().toLocaleString() });
    };
    actions.appendChild(uploadBtn);
  }

  if (state.appState === 'completed' && state.demoId) {
    var viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-done';
    viewBtn.textContent = 'View Demo Result';
    viewBtn.onclick = function () {
      sendCommand({ type: 'OPEN_RESULT', demoId: state.demoId });
    };
    actions.appendChild(viewBtn);

    var newBtn = document.createElement('button');
    newBtn.className = 'btn btn-new';
    newBtn.textContent = 'New Recording';
    newBtn.onclick = function () {
      sendCommand({ type: 'CLEAR_SESSION' });
    };
    actions.appendChild(newBtn);
  }

  if (state.appState === 'error') {
    var resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-secondary';
    resetBtn.textContent = 'Reset';
    resetBtn.onclick = function () {
      sendCommand({ type: 'CLEAR_SESSION' });
    };
    actions.appendChild(resetBtn);
  }

  content.appendChild(actions);
  root.appendChild(content);

  // Settings
  if (state.appState === 'idle') {
    root.appendChild(createSettingsPanel());
  }
}
