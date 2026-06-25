import { DEFAULT_BACKEND_URL, SETTINGS_KEY } from '../../shared/constants.js';
import { state } from '../state.js';

var isOpen = false;

/**
 * @returns {HTMLElement}
 */
export function createSettingsPanel() {
  var container = document.createElement('div');
  container.style.cssText = 'border-top:1px solid #374151;margin-top:auto;';

  // Toggle
  var toggle = document.createElement('button');
  toggle.className = 'settings-toggle';
  toggle.innerHTML = '<span>Settings</span><span class="settings-toggle-arrow">&blacktriangledown;</span>';
  toggle.onclick = function () {
    isOpen = !isOpen;
    body.classList.toggle('hidden', !isOpen);
    toggle.querySelector('.settings-toggle-arrow').classList.toggle('open', isOpen);
  };
  container.appendChild(toggle);

  // Body
  var body = document.createElement('div');
  body.className = 'settings-body hidden';
  body.style.cssText = 'padding:0 16px 12px;display:flex;flex-direction:column;gap:12px;';

  // Backend URL
  var urlLabel = document.createElement('label');
  urlLabel.className = 'settings-label';
  urlLabel.textContent = 'Backend URL';
  body.appendChild(urlLabel);

  var urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.className = 'settings-input';
  urlInput.value = state.backendUrl;
  urlInput.placeholder = DEFAULT_BACKEND_URL;
  urlInput.onchange = function () {
    state.backendUrl = urlInput.value.trim() || DEFAULT_BACKEND_URL;
  };
  body.appendChild(urlInput);

  // Save
  var saveBtn = document.createElement('button');
  saveBtn.className = 'settings-save';
  saveBtn.textContent = 'Save Settings';
  saveBtn.onclick = function () {
    chrome.storage.local.set({ [SETTINGS_KEY]: { backendUrl: state.backendUrl } }, function () {
      saveBtn.textContent = 'Saved!';
      setTimeout(function () { saveBtn.textContent = 'Save Settings'; }, 2000);
    });
  };
  body.appendChild(saveBtn);

  container.appendChild(body);
  return container;
}
