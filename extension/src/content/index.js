// ── state ──
let port = null;
let recordingStartTime = 0;
let isTracking = false;

// ── helpers ──

/**
 * @param {Element} el
 * @returns {string}
 */
function getMeaningfulText(el) {
  if (el.placeholder) return el.placeholder;
  if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
  if (el.labels?.[0]?.textContent) return el.labels[0].textContent.trim();
  if (el.textContent) {
    const t = el.textContent.trim();
    if (t.length <= 80) return t;
  }
  if (el.name) return el.name;
  return el.tagName.toLowerCase();
}

/**
 * @param {Element} el
 * @returns {boolean}
 */
function shouldTrack(el) {
  if (!el || el === document.body || el === document.documentElement) return false;
  const tag = el.tagName.toLowerCase();
  if (['a', 'button', 'input', 'select', 'textarea', 'label'].includes(tag)) return true;
  const role = el.getAttribute('role');
  if (role && ['button', 'link', 'textbox', 'combobox', 'menuitem', 'tab', 'switch', 'checkbox', 'radio'].includes(role)) return true;
  if (el.hasAttribute('onclick') || el.getAttribute('data-action')) return true;
  return false;
}

/**
 * @param {Element} el
 * @returns {{ x: number, y: number, width: number, height: number, top: number, left: number }}
 */
function getBoundingRect(el) {
  const r = el.getBoundingClientRect();
  return {
    x: Math.round(r.x),
    y: Math.round(r.y),
    width: Math.round(r.width),
    height: Math.round(r.height),
    top: Math.round(r.top),
    left: Math.round(r.left),
  };
}

/**
 * @param {string} type
 * @param {Element} [el]
 * @param {Object} [extra]
 * @returns {Object}
 */
function createEvent(type, el, extra) {
  const target = el || document.body;
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now() - recordingStartTime,
    type,
    pageTitle: document.title,
    url: window.location.href,
    elementText: el ? getMeaningfulText(target) : '',
    elementRole: target.getAttribute('role') || target.tagName.toLowerCase(),
    elementSelector: el ? buildSelector(target) : undefined,
    boundingRect: el ? getBoundingRect(target) : null,
    ...(extra || {}),
  };
}

/**
 * @param {Element} el
 * @returns {string}
 */
function buildSelector(el) {
  if (el.id) return '#' + el.id;
  const parts = [];
  let current = el;
  while (current && current !== document.body && parts.length < 3) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      parts.unshift('#' + current.id);
      break;
    }
    if (current.className && typeof current.className === 'string') {
      const cls = current.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (cls) selector += '.' + cls;
    }
    parts.unshift(selector);
    current = current.parentElement;
  }
  return parts.join(' > ');
}

/**
 * @param {Object} event
 */
function emitEvent(event) {
  if (port) {
    port.postMessage({ type: 'EVENT_RECORDED', event });
  }
}

// ── listeners ──

/** @param {MouseEvent} e */
function handleClick(e) {
  const el = /** @type {Element} */ (e.target);
  if (!el || !shouldTrack(el)) return;
  emitEvent(createEvent('click', el));
}

/** @param {Event} e */
function handleChange(e) {
  const el = /** @type {Element} */ (e.target);
  if (!el || !shouldTrack(el)) return;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    emitEvent(createEvent('input', el, { inputValue: el.value }));
  }
}

/** @param {Event} e */
function handleSubmit(e) {
  const el = /** @type {Element} */ (e.target);
  emitEvent(createEvent('submit', el));
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

// ── navigation ──

let lastUrl = window.location.href;

function checkNavigation() {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    emitEvent(createEvent('navigation'));
  }
}

// ── lifecycle ──

/** @param {number} startTime */
function startTracking(startTime) {
  recordingStartTime = startTime;
  isTracking = true;
  lastUrl = window.location.href;
  setupListeners();
  emitEvent(createEvent('page_load'));
  setInterval(function () {
    if (isTracking) checkNavigation();
  }, 500);
}

function stopTracking() {
  isTracking = false;
  removeListeners();
  if (port) {
    port.postMessage({ type: 'TRACKING_STOPPED' });
    port.disconnect();
    port = null;
  }
}

// ── connect ──

port = chrome.runtime.connect({ name: 'content-events' });

port.onMessage.addListener(function (msg) {
  switch (msg.type) {
    case 'START_TRACKING':
      startTracking(msg.recordingStartTime);
      break;
    case 'STOP_TRACKING':
      stopTracking();
      break;
  }
});

port.onDisconnect.addListener(function () {
  if (isTracking) {
    removeListeners();
    isTracking = false;
  }
  port = null;
});

port.postMessage({ type: 'TRACKING_STARTED' });
