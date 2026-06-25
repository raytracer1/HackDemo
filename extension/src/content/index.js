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
  if (el.placeholder) return el.placeholder;
  var label = el.getAttribute('aria-label');
  if (label) return label;
  if (el.labels && el.labels[0] && el.labels[0].textContent) return el.labels[0].textContent.trim();
  if (el.textContent) { var t = el.textContent.trim(); if (t.length <= 80) return t; }
  if (el.name) return el.name;
  return el.tagName.toLowerCase();
}

function getRole(el) {
  return el.getAttribute('role') || el.tagName.toLowerCase();
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
  console.log('[HackDemo]', type + ':', event.elementText);

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

function startTracking(startTime) {
  recordingStartTime = startTime;
  isTracking = true;
  events = [];
  steps = [];
  currentStep = { events: [], highlights: [] };
  lastStepTime = 0;

  setupListeners();
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



