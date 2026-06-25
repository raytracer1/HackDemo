var CONFIG = {
  idle:          { cls: 'idle',           label: 'Ready' },
  recording:     { cls: 'recording',      label: 'Recording...' },
  paused:        { cls: 'uploading',      label: 'Paused' },
  uploading:     { cls: 'uploading',      label: 'Uploading...' },
  processing:    { cls: 'processing',     label: 'Processing...' },
  completed:     { cls: 'completed',      label: 'Demo Ready!' },
  error:         { cls: 'error',          label: 'Error' },
};

/**
 * @param {string} appState
 * @param {string|null} error
 * @returns {HTMLElement}
 */
export function createStatusBanner(appState, error) {
  var config = CONFIG[appState] || CONFIG.idle;

  var banner = document.createElement('div');
  banner.className = 'status-banner ' + config.cls;

  var dot = document.createElement('span');
  dot.className = 'status-dot';
  if (appState === 'recording') dot.className += ' recording';
  banner.appendChild(dot);

  var label = document.createElement('span');
  label.textContent = (appState === 'error' && error) ? error : config.label;
  banner.appendChild(label);

  return banner;
}
