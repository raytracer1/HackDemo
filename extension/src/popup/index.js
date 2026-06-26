import { setRender } from './state.js';
import { render } from './App.js';

setRender(render);
render();

// Blur page when popup opens
chrome.runtime.sendMessage({ type: 'POPUP_OPENED' }).catch(function () {});

window.addEventListener('beforeunload', function () {
  chrome.runtime.sendMessage({ type: 'POPUP_CLOSED' }).catch(function () {});
});
