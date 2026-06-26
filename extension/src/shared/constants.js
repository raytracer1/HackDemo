/**
 * Backend URL for API calls.
 * @type {string}
 */
export const DEFAULT_BACKEND_URL = 'https://hack-demo-du4z.vercel.app';
export const DEFAULT_FRONTEND_URL = 'https://hack-demo-sooty.vercel.app';

/**
 * Maximum gap (ms) between events before starting a new step.
 * @type {number}
 */
export const STEP_MERGE_WINDOW_MS = 2500;

/**
 * Maximum recording duration (10 minutes).
 * @type {number}
 */
export const MAX_RECORDING_DURATION_MS = 10 * 60 * 1000;

/**
 * Chrome storage keys.
 */
export const SESSION_KEY = 'recordingSession';
export const SETTINGS_KEY = 'appSettings';
