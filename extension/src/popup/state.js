import { DEFAULT_BACKEND_URL, SETTINGS_KEY } from '../shared/constants.js';

/**
 * Global popup state.
 * @type {{
 *   appState: string,
 *   steps: Object[],
 *   duration: number,
 *   progress: { phase: string, percent: number },
 *   error: string|null,
 *   demoId: string|null,
 *   backendUrl: string,
 * }}
 */
export const state = {
  appState: 'idle',
  steps: [],
  duration: 0,
  progress: { phase: '', percent: 0 },
  error: null,
  demoId: null,
  backendUrl: DEFAULT_BACKEND_URL,
};

/** @type {Function|null} */
let renderFn = null;

/**
 * Register the render callback.
 * @param {Function} fn
 */
export function setRender(fn) {
  renderFn = fn;
}

/**
 * Trigger a re-render of the popup UI.
 */
export function render() {
  if (renderFn) renderFn();
}

/**
 * Merge partial state and re-render.
 * @param {Object} partial
 */
export function updateState(partial) {
  Object.assign(state, partial);
  render();
}

/**
 * Send a command to the background service worker.
 * @param {Object} cmd
 */
export function sendCommand(cmd) {
  chrome.runtime.sendMessage(cmd).catch(function (err) {
    console.error('[HackDemo] sendMessage error:', err);
  });
}

// ── Message handler ──

chrome.runtime.onMessage.addListener(function (msg) {
  switch (msg.type) {
    case 'STATUS_UPDATE':
      updateState({
        appState: msg.state,
        duration: msg.recordingDuration != null ? msg.recordingDuration : state.duration,
      });
      break;

    case 'STEPS_READY':
      updateState({ steps: msg.steps, appState: 'steps_review' });
      break;

    case 'UPLOAD_PROGRESS':
      updateState({ progress: { phase: msg.phase, percent: msg.percent } });
      break;

    case 'UPLOAD_COMPLETE':
      updateState({ demoId: msg.demoId, appState: 'processing' });
      break;

    case 'PROCESSING_UPDATE':
      updateState({
        progress: {
          phase: msg.status,
          percent: Math.min(state.progress.percent + 10, 90),
        },
      });
      break;

    case 'PROCESSING_COMPLETE':
      if (msg.demo && msg.demo.steps) {
        var steps = msg.demo.steps.map(function (s) {
          return {
            index: s.index,
            events: [],
            startTime: s.startTime,
            endTime: s.endTime,
            description: s.description,
            actionType: 'mixed',
            pageContext: { title: s.pageTitle, url: s.pageUrl },
            narration: s.narration || undefined,
            audioUrl: s.audioUrl || undefined,
            durationMs: s.durationMs || undefined,
          };
        });
        updateState({ steps: steps, progress: { phase: 'Complete', percent: 100 }, appState: 'completed' });
      }
      break;

    case 'ERROR':
      updateState({ error: msg.message, appState: 'error' });
      break;
  }
});

// ── Duration polling ──

setInterval(function () {
  if (state.appState === 'recording') {
    sendCommand({ type: 'GET_STATUS' });
  }
}, 1000);

// ── Init ──

chrome.storage.local.get(SETTINGS_KEY, function (result) {
  if (result[SETTINGS_KEY]) {
    state.backendUrl = result[SETTINGS_KEY].backendUrl || DEFAULT_BACKEND_URL;
  }
});

sendCommand({ type: 'GET_STATUS' });
