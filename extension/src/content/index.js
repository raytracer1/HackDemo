// ── HackDemo Content Script ──
// Tracks events, detects step boundaries, requests screenshots from background.

console.log('[HackDemo] Content script loaded:', window.location.href);

let isTracking = false;
let recordingStartTime = 0;
let events = [];
let steps = [];
let currentStep = { events: [], highlights: [] };
let lastStepTime = 0;
let screenshotRequests = 0; // count of pending screenshot requests

// ── Step boundary ──

function isStepBoundary(event, el) {
  // Submit always closes the step
  if (event.type === 'submit') return true;
  // Every click is its own step
  if (event.type === 'click') return true;
  return false;
}

// ── Screenshot request to background ──

function requestScreenshot() {
  screenshotRequests++;
  chrome.runtime.sendMessage({ type: 'CAPTURE' }).then(function (resp) {
    screenshotRequests--;
  }).catch(function () {
    screenshotRequests--;
  });
}

async function waitForScreenshots() {
  // Wait up to 2 seconds for pending screenshots
  var waited = 0;
  while (screenshotRequests > 0 && waited < 2000) {
    await new Promise(function (r) { return setTimeout(r, 100); });
    waited += 100;
  }
}

// ── Step management ──

function finishStep() {
  if (currentStep.events.length === 0) return;

  requestScreenshot();

  steps.push({
    events: currentStep.events.slice(),
    highlights: currentStep.highlights.slice(),
  });

  console.log('[HackDemo] Step ' + steps.length + ' saved,', currentStep.events.length, 'events');

  chrome.runtime.sendMessage({ type: 'STEP_COUNT', count: steps.length }).catch(function () {});

  currentStep = { events: [], highlights: [] };
}

// ── Helpers ──

function getMeaningfulText(el) {
  if (!el) return '';
  var text = '';

  // Priority 1: Explicit semantic attributes
  text = el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('title') || el.getAttribute('data-tooltip');
  if (text) return text.trim();

  // Priority 2: Input-specific
  if (el.placeholder) return el.placeholder;
  if (el.name && el.name.length > 1) return el.name;
  if (el.labels && el.labels[0] && el.labels[0].textContent) return el.labels[0].textContent.trim();

  // Priority 3: Direct text content (buttons, links, etc.)
  if (el.textContent) {
    text = el.textContent.trim();
    if (text.length > 0 && text.length <= 80) return text;
  }

  // Priority 4: Climb up to find meaningful parent text
  var parent = el.parentElement;
  var depth = 0;
  while (parent && depth < 3) {
    // Check parent's aria-label
    var pl = parent.getAttribute('aria-label');
    if (pl) return pl.trim();

    // Check if parent is a list item or section with a heading
    var heading = parent.querySelector('h1, h2, h3, h4, h5, h6, strong, label');
    if (heading && heading.textContent) {
      return heading.textContent.trim().slice(0, 80);
    }

    parent = parent.parentElement;
    depth++;
  }

  // Priority 5: href for links
  if (el.tagName === 'A' || el.closest('a')) {
    var link = el.tagName === 'A' ? el : el.closest('a');
    if (link) {
      var href = link.getAttribute('href');
      if (href && href.length > 1 && href !== '#') return href;
    }
  }

  // Last resort
  return el.tagName.toLowerCase();
}

function getRole(el) {
  // ARIA role
  var role = el.getAttribute('role');
  if (role) return role;

  var tag = el.tagName.toLowerCase();
  if (tag === 'a') return 'link';
  if (tag === 'input') {
    var type = (el.type || 'text').toLowerCase();
    if (type === 'submit') return 'submit_button';
    if (type === 'button') return 'button';
    return type + '_input';
  }
  if (tag === 'button') return 'button';
  if (tag === 'textarea') return 'text_input';
  if (tag === 'select') return 'dropdown';
  if (tag === 'img') return 'image';
  if (tag === 'form') return 'form';
  return tag;
}

function getBoundingRect(el) {
  var r = el.getBoundingClientRect();
  return {
    x: Math.round(r.x), y: Math.round(r.y),
    width: Math.round(r.width), height: Math.round(r.height),
    top: Math.round(r.top), left: Math.round(r.left),
  };
}

function createEvent(type, el, extra) {
  var target = el || document.body;
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now() - recordingStartTime,
    type: type,
    pageTitle: document.title,
    url: window.location.href,
    elementText: el ? getMeaningfulText(target) : '',
    elementRole: getRole(target),
    boundingRect: el ? getBoundingRect(target) : null,
  };
}

function recordEvent(type, el, extra) {
  if (!isTracking) return;
  if (!el) return;

  var event = createEvent(type, el, extra);
  console.log('[HackDemo] event:', JSON.stringify({ type: event.type, elementText: event.elementText, elementRole: event.elementRole }));

  events.push(event);
  currentStep.events.push(event);

  if (event.boundingRect && event.boundingRect.width > 0) {
    currentStep.highlights.push({
      type: event.type,
      elementText: event.elementText,
      elementRole: event.elementRole,
      boundingRect: event.boundingRect,
    });
  }

  if (isStepBoundary(event, el)) {
    lastStepTime = event.timestamp;
    finishStep();
  }
}

// ── Event listeners ──

function handleClick(e) {
  recordEvent('click', e.target);
}

function handleChange(e) {
  var el = e.target;
  if (!el) return;
  // Skip file, hidden, checkbox, radio inputs
  var type = (el.type || '').toLowerCase();
  if (type === 'file' || type === 'hidden' || type === 'checkbox' || type === 'radio') return;
  var tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    recordEvent('input', el, { inputValue: el.value });
  }
}

function handleSubmit(e) {
  recordEvent('submit', e.target);
}

function setupListeners() {
  document.addEventListener('click', handleClick, { capture: true, passive: true });
  document.addEventListener('change', handleChange, { capture: true, passive: true });
  document.addEventListener('submit', handleSubmit, { capture: true, passive: false });
}

function removeListeners() {
  document.removeEventListener('click', handleClick, { capture: true });
  document.removeEventListener('change', handleChange, { capture: true });
  document.removeEventListener('submit', handleSubmit, { capture: true });
}




// ── Lifecycle ──

// ── Start overlay ──

function showStartOverlay() {
  var overlay = document.createElement('div');
  overlay.innerHTML = `
    <div style="
      position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;
      display:flex;align-items:center;justify-content:center;
      pointer-events:none;
    ">
      <div id="hackdemo-start-hint" style="
        background:#1f2937;color:#f3f4f6;padding:24px 40px;border-radius:16px;
        font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:18px;
        font-weight:600;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.4);
        animation:hdfade 3s ease forwards;opacity:0;
      ">
        <div style="display:flex;align-items:center;gap:10px;justify-content:center;">
          <span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block;"></span>
          Recording started
        </div>
        <div style="font-size:13px;color:#9ca3af;margin-top:8px;font-weight:400;">
          Perform your demo — click Done in the extension when finished
        </div>
      </div>
    </div>
    <style>
      @keyframes hdfade {
        0%   { opacity:0; transform:translateY(-10px); }
        15%  { opacity:1; transform:translateY(0); }
        70%  { opacity:1; transform:translateY(0); }
        100% { opacity:0; transform:translateY(-5px); }
      }
    </style>
  `;
  document.body.appendChild(overlay);
  setTimeout(function () { overlay.remove(); }, 3500);
}

function startTracking(startTime) {
  recordingStartTime = startTime;
  isTracking = true;
  events = [];
  steps = [];
  currentStep = { events: [], highlights: [] };
  lastStepTime = 0;

  setupListeners();
  showStartOverlay();
  chrome.runtime.sendMessage({ type: 'STEP_COUNT', count: 0 }).catch(function () {});
  console.log('[HackDemo] Recording started');
}

function stopTracking() {
  isTracking = false;
  removeListeners();
  console.log('[HackDemo] Recording stopped');
}

async function sendData() {
  // Finish current step
  if (currentStep.events.length > 0) {
    requestScreenshot();
    steps.push({
      events: currentStep.events.slice(),
      highlights: currentStep.highlights.slice(),
    });
  }

  await waitForScreenshots();

  console.log('[HackDemo] Sending', steps.length, 'steps,', events.length, 'events');

  chrome.runtime.sendMessage({
    type: 'RECORDING_DATA',
    events: events,
    steps: steps,
  });
}

// ── Message handlers ──

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  switch (msg.type) {
    case 'START_TRACKING':
      startTracking(msg.recordingStartTime);
      sendResponse({ ok: true });
      break;
    case 'STOP_TRACKING':
      stopTracking();
      sendResponse({ ok: true });
      break;
    case 'GET_DATA':
      stopTracking();
      sendData().then(function () {
        sendResponse({ ok: true });
      });
      return true; // async
  }
});



