// ── HackDemo Content Script ──
// Tracks events, detects step boundaries, requests screenshots from background.

console.log('[HackDemo] Content script loaded:', window.location.href);

let isTracking = false;
let isActive = false; // true after blur overlay fades
let recordingStartTime = 0;
let pauseStartTime = 0;
let totalPauseMs = 0;
let events = [];
let steps = [];
let currentStep = { events: [], highlights: [] };
let lastStepTime = 0;

// ── Step boundary ──

function isStepBoundary(event, el) {
  // Submit always closes the step
  if (event.type === 'submit') return true;
  // Every click is its own step
  if (event.type === 'click') return true;
  return false;
}

// ── Screenshot request to background ──

// ── DOM stability detection ──

function waitForDomStable() {
  return new Promise(function (resolve) {
    var timer = setTimeout(function () { observer.disconnect(); resolve(Date.now() - recordingStartTime); }, 400);
    var observer = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(function () { observer.disconnect(); resolve(Date.now() - recordingStartTime); }, 400);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  });
}

// Update last step's stableTime on scroll (if already set)
window.addEventListener('scroll', function () {
  if (!isActive || steps.length === 0) return;
  var last = steps[steps.length - 1];
  if (last && last.stableTime) {
    last.stableTime = Date.now() - recordingStartTime;
  }
}, { passive: true });

// ── Step management ──

// Email / phone regex patterns
var EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
var PHONE_RE = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{3,6}/;
var CREDIT_RE = /\b(?:\d[ -]*?){13,19}\b/;

function scanTextForSensitive(el) {
  if (!el || !el.textContent) return false;
  var text = el.textContent.trim();
  if (!text) return false;
  if (text.length > 100) return false; // skip large text blocks
  return EMAIL_RE.test(text) || PHONE_RE.test(text) || CREDIT_RE.test(text);
}

function scanSensitiveFields() {
  if (!hideSensitive) return [];
  var results = [];
  // Scan inputs
  var inputs = document.querySelectorAll('input[type="password"], input[type="email"], input[name], input[id], input[placeholder]');
  for (var i = 0; i < inputs.length; i++) {
    if (isSensitiveField(inputs[i])) {
      results.push({ type: 'sensitive', elementText: '', elementRole: 'input', boundingRect: getBoundingRect(inputs[i]), viewport: { width: window.innerWidth, height: window.innerHeight } });
    }
  }
  // Scan visible text for emails/phones/cards
  var allEls = document.querySelectorAll('span, div, p, td, th, li, a, label, h1, h2, h3, h4, h5, h6');
  for (var i = 0; i < allEls.length; i++) {
    var el = allEls[i];
    if (el.offsetParent === null) continue; // skip hidden elements
    if (el.querySelector('input')) continue; // skip containers of inputs (already handled)
    // Only check leaf-level text elements
    if (el.children.length === 0 && scanTextForSensitive(el)) {
      var rect = getBoundingRect(el);
      if (rect.width > 0 && rect.height > 0) {
        results.push({ type: 'sensitive', elementText: '', elementRole: el.tagName.toLowerCase(), boundingRect: rect, viewport: { width: window.innerWidth, height: window.innerHeight } });
      }
    }
  }
  // Deduplicate overlapping rects
  var filtered = [];
  for (var i = 0; i < results.length; i++) {
    var dup = false;
    for (var j = 0; j < filtered.length; j++) {
      if (Math.abs(results[i].boundingRect.x - filtered[j].boundingRect.x) < 5 &&
          Math.abs(results[i].boundingRect.y - filtered[j].boundingRect.y) < 5) { dup = true; break; }
    }
    if (!dup) filtered.push(results[i]);
  }
  return filtered;
}

async function finishStep() {
  if (currentStep.events.length === 0) return;

  // Wait for DOM to stabilize (MutationObserver, no changes for 400ms)
  var stableTime = await waitForDomStable();

  // Scan full page for sensitive fields
  var sensitiveFields = scanSensitiveFields();
  for (var si = 0; si < sensitiveFields.length; si++) {
    currentStep.highlights.push(sensitiveFields[si]);
  }

  steps.push({
    events: currentStep.events.slice(),
    highlights: currentStep.highlights.slice(),
    stableTime: stableTime,
  });

  console.log('[HackDemo] Step ' + steps.length + ' saved,', currentStep.events.length, 'events');

  chrome.runtime.sendMessage({ type: 'STEP_COUNT', count: steps.length }).catch(function () {});

  // Update recording bar text if visible
  panelSteps = steps;
  if (panelState === 'recording' || panelState === 'paused') {
    var label = document.querySelector('#hd-panel-inner span');
    if (label) label.textContent = 'Recording — ' + steps.length + ' steps';
  }

  currentStep = { events: [], highlights: [] };
}

// ── Sensitive field detection ──

function isSensitiveField(el) {
  if (!el) return false;
  var tag = el.tagName.toLowerCase();
  var type = (el.type || '').toLowerCase();
  // Password fields
  if (tag === 'input' && type === 'password') return true;
  // Email fields (may contain PII)
  if (tag === 'input' && type === 'email') return true;
  // Credit card / sensitive named fields
  var name = (el.name || '').toLowerCase();
  var id = (el.id || '').toLowerCase();
  var placeholder = (el.placeholder || '').toLowerCase();
  var keywords = ['password', 'secret', 'token', 'api_key', 'apikey', 'credit', 'card', 'ssn', 'pin', 'passcode', 'username', 'user', 'login', 'email', 'phone', 'mobile', 'address', 'name'];
  for (var i = 0; i < keywords.length; i++) {
    if (name.includes(keywords[i]) || id.includes(keywords[i]) || placeholder.includes(keywords[i])) return true;
  }
  return false;
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
  if (!el) {
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now() - recordingStartTime - totalPauseMs,
      type: type,
      pageTitle: document.title,
      url: window.location.href,
      elementText: '',
      elementRole: '',
      boundingRect: null,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      ...(extra || {}),
    };
  }
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now() - recordingStartTime - totalPauseMs,
    type: type,
    pageTitle: document.title,
    url: window.location.href,
    elementText: el ? getMeaningfulText(target) : '',
    elementRole: getRole(target),
    boundingRect: el ? getBoundingRect(target) : null,
    viewport: { width: window.innerWidth, height: window.innerHeight },
  };
}

function recordEvent(type, el, extra) {
  if (!isActive) return;
  if (!el) return;
  // Ignore clicks inside HackDemo panel
  if (el.closest && el.closest('#hackdemo-panel')) return;

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
      viewport: { width: window.innerWidth, height: window.innerHeight },
    });
  }

  // Track sensitive fields for blurring (respect privacy setting)
  if (hideSensitive && el && isSensitiveField(el)) {
    currentStep.highlights.push({
      type: 'sensitive',
      elementText: '',
      elementRole: el.tagName.toLowerCase(),
      boundingRect: getBoundingRect(el),
      viewport: { width: window.innerWidth, height: window.innerHeight },
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

// ── Page blur (popup open) ──

var blurEl = null;

function showBlur() {
  if (blurEl) return;
  blurEl = document.createElement('div');
  blurEl.id = 'hackdemo-blur';
  blurEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483640;backdrop-filter:blur(6px);background:rgba(0,0,0,0.2);';
  document.body.appendChild(blurEl);
  console.log('[HackDemo] Blur shown');
}

function hideBlur() {
  if (blurEl) { blurEl.remove(); blurEl = null; }
  // After start overlay fades, recording actually begins
  if (!isTracking) return;
  if (steps.length === 0) {
    chrome.runtime.sendMessage({ type: 'START_SCREEN_RECORDING' }).catch(function () {});
  }
}

// ── Floating panel (Guidde-style) ──

var panel = null;
var panelState = 'idle';
var selectedLanguage = 'English (US)';
var hideSensitive = true;
var panelDuration = 0;
var panelSteps = [];
var panelProgress = { phase: '', percent: 0 };
var panelError = null;
var panelDemoId = null;

var manualPaused = false;

// Recording is active only when panel hidden + not manually paused
function shouldRecord() { return !panel && !manualPaused; }

function togglePanel() {
  if (panel) {
    closePanel();
    // Resume after 300ms for clean frames
    if (!manualPaused) {
      setTimeout(function () { sendCmd({ type: 'RESUME_RECORDING' }); }, 300);
    }
    return;
  }
  // Pause recording when panel opens
  sendCmd({ type: 'PAUSE_RECORDING' });
  setTimeout(function () { showBlur(); openPanel(); }, 300);
}

function toggleManualPause() {
  manualPaused = !manualPaused;
  if (manualPaused) {
    sendCmd({ type: 'PAUSE_RECORDING' });
    closePanel();
    showRecBar();
  } else {
    closePanel();
    setTimeout(function () {
      sendCmd({ type: 'RESUME_RECORDING' });
    }, 300);
  }
}

function openPanel() {
  // During recording: show compact bar
  if (panelState === 'recording' || panelState === 'paused') {
    showRecBar();
    return;
  }
  if (panel) return;

  if (panel) return;
  panel = document.createElement('div');
  panel.id = 'hackdemo-panel';
  renderFullPanel();
}

function showRecBar() {
  if (panel) closePanel();
  panel = document.createElement('div');
  panel.id = 'hackdemo-panel';
  panel.innerHTML = `
    <div id="hd-panel-inner" style="
      position:fixed;top:16px;right:24px;z-index:2147483647;
      background:#fff;border-radius:14px;padding:14px 20px;
      box-shadow:0 4px 20px rgba(0,0,0,0.12);
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:#1e293b;
      display:flex;align-items:center;gap:14px;
      animation:hdslidein 0.2s ease;
    "></div>
  `;
  document.body.appendChild(panel);
  addRecBarButtons();
}

function addRecBarButtons() {
  var inner = document.getElementById('hd-panel-inner');
  if (!inner) return;

  // Recording dot + step count
  var dot = document.createElement('span');
  dot.style.cssText = 'width:10px;height:10px;border-radius:50%;background:#ef4444;animation:recpulse 1.5s infinite;flex-shrink:0;';
  inner.appendChild(dot);

  var label = document.createElement('span');
  label.style.cssText = 'font-weight:600;flex:1;font-size:14px;';
  label.textContent = 'Recording — ' + panelSteps.length + ' steps';
  inner.appendChild(label);

  var btns = document.createElement('div');
  btns.style.cssText = 'display:flex;gap:8px;align-items:center;';

  var pauseBtn = document.createElement('button');
  pauseBtn.style.cssText = 'display:flex;align-items:center;gap:4px;padding:8px 14px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-weight:500;color:#475569;cursor:pointer;white-space:nowrap;';
  pauseBtn.innerHTML = manualPaused ? '&#9654; Resume' : '&#10074;&#10074; Pause';
  pauseBtn.onclick = function () { toggleManualPause(); };
  btns.appendChild(pauseBtn);

  var delBtn = document.createElement('button');
  delBtn.style.cssText = 'display:flex;align-items:center;gap:4px;padding:8px 14px;background:#f1f5f9;border:1px solid #fecaca;border-radius:8px;font-size:13px;font-weight:500;color:#ef4444;cursor:pointer;white-space:nowrap;';
  delBtn.innerHTML = '&#128465; Delete';
  delBtn.onclick = function () { if (confirm('Discard?')) sendCmd({ type: 'DELETE_RECORDING' }); };
  btns.appendChild(delBtn);

  var doneBtn = document.createElement('button');
  doneBtn.style.cssText = 'display:flex;align-items:center;gap:4px;padding:8px 18px;background:#22c55e;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;';
  doneBtn.innerHTML = '&#10003; Done';
  doneBtn.onclick = function () { sendCmd({ type: 'DONE_RECORDING' }); };
  btns.appendChild(doneBtn);

  inner.appendChild(btns);
}

function renderFullPanel() {
  panel.innerHTML = `
    <div id="hd-panel-inner" style="
      position:fixed;top:24px;right:24px;z-index:2147483647;
      width:380px;background:#fff;border-radius:16px;
      box-shadow:0 8px 32px rgba(0,0,0,0.15),0 2px 4px rgba(0,0,0,0.08);
      font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;color:#1e293b;
      overflow:hidden;transition:all 0.2s ease;
      animation:hdslidein 0.2s ease;
    "></div>
    <style>
      @keyframes hdslidein { from{opacity:0;transform:translateY(-12px);} to{opacity:1;transform:translateY(0);} }
      @keyframes recpulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    </style>
  `;
  document.body.appendChild(panel);
  renderPanel();
}

function showSettingsInPanel() {
  var inner = document.getElementById('hd-panel-inner');
  if (!inner) return;
  inner.innerHTML = '';

  var backBtn = document.createElement('button');
  backBtn.style.cssText = 'background:none;border:none;color:#6366f1;font-size:13px;cursor:pointer;padding:18px 24px 0;text-align:left;';
  backBtn.innerHTML = '&larr; Back';
  backBtn.onclick = renderFullPanel;
  inner.appendChild(backBtn);

  var body = document.createElement('div');
  body.style.cssText = 'padding:16px 24px 24px;display:flex;flex-direction:column;gap:16px;';

  // Language
  var langRow = document.createElement('div');
  langRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;';

  var langLbl = document.createElement('span');
  langLbl.style.cssText = 'font-size:13px;font-weight:500;white-space:nowrap;';
  langLbl.textContent = 'Language';
  langRow.appendChild(langLbl);

  var sel = document.createElement('select');
  sel.style.cssText = 'padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none;cursor:pointer;';
  ['English (US)', 'English (UK)', 'Chinese (Mandarin)', 'Chinese (Cantonese)', 'Japanese', 'Korean', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Russian', 'Arabic', 'Hindi', 'Dutch', 'Polish', 'Turkish', 'Swedish', 'Thai', 'Vietnamese', 'Indonesian'].forEach(function (l) {
    var o = document.createElement('option'); o.textContent = l; sel.appendChild(o);
  });
  sel.value = selectedLanguage;
  sel.onchange = function () { selectedLanguage = sel.value; };
  langRow.appendChild(sel);
  body.appendChild(langRow);

  // Privacy toggle
  var priv = document.createElement('div');
  priv.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
  var pl = document.createElement('span');
  pl.style.cssText = 'font-size:13px;font-weight:500;';
  pl.textContent = 'Blur sensitive info in screenshots';
  priv.appendChild(pl);
  var tog = document.createElement('input');
  tog.type = 'checkbox'; tog.style.cssText = 'cursor:pointer;'; tog.checked = hideSensitive;
  tog.onchange = function () { hideSensitive = tog.checked; };
  priv.appendChild(tog);
  body.appendChild(priv);

  inner.appendChild(body);
}

function closePanel() {
  if (panel) { panel.remove(); panel = null; }
  hideBlur();
}

function sendCmd(cmd) {
  chrome.runtime.sendMessage(cmd).catch(function () {});
}

function renderPanel() {
  var inner = document.getElementById('hd-panel-inner');
  if (!inner) return;
  inner.innerHTML = '';

  // Header
  var hdr = document.createElement('div');
  hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:18px 24px;';
  var hLeft = document.createElement('div');
  hLeft.style.cssText = 'display:flex;align-items:center;gap:8px;';
  var hIcon = document.createElement('div');
  hIcon.style.cssText = 'width:28px;height:28px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;';
  hIcon.textContent = 'H';
  hLeft.appendChild(hIcon);
  var hTitle = document.createElement('span');
  hTitle.style.cssText = 'font-size:16px;font-weight:700;';
  hTitle.textContent = 'HackDemo';
  hLeft.appendChild(hTitle);
  hdr.appendChild(hLeft);

  var hdrRight = document.createElement('div');
  hdrRight.style.cssText = 'display:flex;align-items:center;gap:6px;';

  var settingsBtn = document.createElement('button');
  settingsBtn.style.cssText = 'background:none;border:none;font-size:22px;color:#94a3b8;cursor:pointer;padding:4px;line-height:1;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;';
  settingsBtn.innerHTML = '&#9881;';
  settingsBtn.title = 'Settings';
  settingsBtn.onclick = function () { showSettingsInPanel(); };
  hdrRight.appendChild(settingsBtn);
  hdr.appendChild(hdrRight);
  inner.appendChild(hdr);

  // Body
  var body = document.createElement('div');
  body.style.cssText = 'padding:0 24px 24px;';

  if (panelState === 'idle') {
    // "Create a guide" layout
    var heading = document.createElement('h1');
    heading.style.cssText = 'font-size:18px;font-weight:700;margin-bottom:16px;';
    heading.textContent = 'Create a guide';
    body.appendChild(heading);

    var lbl = document.createElement('label');
    lbl.style.cssText = 'display:block;font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.04em;';
    lbl.textContent = 'What would you like to create?';
    body.appendChild(lbl);

    var sel = document.createElement('select');
    sel.style.cssText = 'width:100%;padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;color:#1e293b;outline:none;cursor:pointer;margin-bottom:18px;';
    ['Product Demo', 'How-to Tutorial', 'Bug Report', 'Feature Walkthrough'].forEach(function (o) {
      var opt = document.createElement('option');
      opt.textContent = o;
      sel.appendChild(opt);
    });
    body.appendChild(sel);

    var startBtn = document.createElement('button');
    startBtn.style.cssText = 'width:100%;height:48px;background:#ef4444;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 2px 12px rgba(239,68,68,0.25);display:flex;align-items:center;justify-content:center;gap:8px;';
    startBtn.innerHTML = '<span style="width:10px;height:10px;border-radius:50%;background:#fff;display:inline-block;"></span> Start Capture';
    startBtn.onclick = function () {
      sendCmd({ type: 'START_RECORDING', language: selectedLanguage, demoType: sel.value });
    };
    body.appendChild(startBtn);
  }

  // Recording controls
  if (panelState === 'recording' || panelState === 'paused') {
    // Step count
    var count = document.createElement('div');
    count.style.cssText = 'text-align:center;font-size:32px;font-weight:700;color:#6366f1;margin-bottom:4px;';
    count.textContent = panelSteps.length || '0';
    body.appendChild(count);

    var countLabel = document.createElement('div');
    countLabel.style.cssText = 'text-align:center;font-size:12px;color:#94a3b8;margin-bottom:16px;';
    countLabel.textContent = panelState === 'paused' ? 'Paused' : 'Recording';
    body.appendChild(countLabel);

    // Done button
    var doneBtn = document.createElement('button');
    doneBtn.style.cssText = 'width:100%;height:48px;background:#22c55e;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 2px 12px rgba(34,197,94,0.25);margin-bottom:10px;';
    doneBtn.textContent = 'Done';
    doneBtn.onclick = function () { sendCmd({ type: 'DONE_RECORDING' }); };
    if (panelState === 'recording') body.appendChild(doneBtn);

    // Pause / Delete
    var subRow = document.createElement('div');
    subRow.style.cssText = 'display:flex;gap:8px;';
    var pauseBtn = document.createElement('button');
    pauseBtn.style.cssText = 'flex:1;padding:8px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;font-weight:500;color:#475569;cursor:pointer;';
    pauseBtn.textContent = manualPaused ? 'Resume' : 'Pause';
    pauseBtn.onclick = function () { toggleManualPause(); };
    subRow.appendChild(pauseBtn);

    // Delete

    var delBtn = document.createElement('button');
    delBtn.style.cssText = 'flex:1;padding:8px;background:#f1f5f9;border:1px solid #fecaca;border-radius:8px;font-size:12px;font-weight:500;color:#ef4444;cursor:pointer;';
    delBtn.textContent = 'Delete';
    delBtn.onclick = function () {
      if (confirm('Discard this recording?')) { sendCmd({ type: 'DELETE_RECORDING' }); }
    };
    subRow.appendChild(delBtn);
    body.appendChild(subRow);
  }

  // Processing or completed
  if (panelState === 'processing' || panelState === 'completed') {
    var statusText = document.createElement('div');
    statusText.style.cssText = 'text-align:center;font-size:14px;font-weight:600;color:#475569;margin-bottom:12px;';
    statusText.textContent = panelState === 'completed' ? 'All done!' : 'Uploading...';
    body.appendChild(statusText);

    if (panelState === 'processing') {
      var bar = document.createElement('div');
      bar.style.cssText = 'width:100%;height:4px;background:#f1f5f9;border-radius:2px;margin-bottom:16px;';
      var fill = document.createElement('div');
      fill.style.cssText = 'height:100%;background:#6366f1;border-radius:2px;width:' + Math.min(panelProgress.percent || 20, 100) + '%;transition:width 0.5s;';
      bar.appendChild(fill);
      body.appendChild(bar);
    }

    if (panelState === 'completed' && panelDemoId) {
      var viewBtn = document.createElement('button');
      viewBtn.style.cssText = 'width:100%;height:40px;background:#22c55e;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:8px;';
      viewBtn.textContent = 'View Demo';
      viewBtn.onclick = function () {
        sendCmd({ type: 'OPEN_RESULT', demoId: panelDemoId });
      };
      body.appendChild(viewBtn);
    }
  }

  if (panelState === 'error') {
    var err = document.createElement('div');
    err.style.cssText = 'text-align:center;font-size:13px;color:#ef4444;margin-bottom:12px;';
    err.textContent = panelError || 'An error occurred';
    body.appendChild(err);

    var resetBtn = document.createElement('button');
    resetBtn.style.cssText = 'width:100%;padding:10px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;color:#475569;cursor:pointer;';
    resetBtn.textContent = 'Try Again';
    resetBtn.onclick = function () { sendCmd({ type: 'CLEAR_SESSION' }); };
    body.appendChild(resetBtn);
  }

  inner.appendChild(body);
}

// Update panel state from background messages
function updatePanelState(data) {
  var prevState = panelState;
  if (data.state !== undefined) panelState = data.state;
  if (data.steps !== undefined) panelSteps = data.steps;
  if (data.demoId !== undefined) panelDemoId = data.demoId;
  if (data.error !== undefined) panelError = data.error;
  if (data.progress) panelProgress = data.progress;
  if (data.recordingDuration !== undefined) panelDuration = data.recordingDuration;

  // Auto-close panel when recording starts (keep blur for overlay)
  if (prevState === 'idle' && panelState === 'recording') {
    if (panel) { panel.remove(); panel = null; }
    return;
  }
  // Close panel when transitioning TO idle/error/completed from something else
  if (prevState !== panelState &&
      (panelState === 'completed' || panelState === 'idle' || panelState === 'error')) {
    closePanel();
    return;
  }
  // Update bar during recording
  if (panelState === 'recording' || panelState === 'paused') {
    if (panel) {
      closePanel();
      showRecBar();
    }
  }
}

// ── Start overlay ──

function showStartOverlay() {
  showBlur();
  var overlay = document.createElement('div');
  overlay.id = 'hackdemo-start-overlay';
  overlay.innerHTML = `
    <div style="
      position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;
      display:flex;align-items:center;justify-content:center;
      pointer-events:none;
    ">
      <div style="
        background:#1f2937;color:#f3f4f6;padding:24px 40px;border-radius:16px;
        font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:18px;
        font-weight:600;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.4);
      ">
        <div style="display:flex;align-items:center;gap:10px;justify-content:center;">
          <span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block;"></span>
          Recording started
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(function () {
    if (overlay.parentNode) overlay.remove();
    hideBlur();
  }, 2000);
}

function startTracking(startTime) {
  recordingStartTime = startTime;
  isTracking = true;
  isActive = false;
  totalPauseMs = 0;
  pauseStartTime = 0;
  events = [];
  steps = [];
  currentStep = { events: [], highlights: [] };
  lastStepTime = 0;

  setupListeners();
  showStartOverlay();
  chrome.runtime.sendMessage({ type: 'STEP_COUNT', count: 0 }).catch(function () {});
  console.log('[HackDemo] Recording prepared');
}

function stopTracking() {
  isTracking = false;
  isActive = false;
  removeListeners();
  hideBlur();
  console.log('[HackDemo] Recording stopped');
}

async function sendData() {
  // Finish current step (scan sensitive fields)
  if (currentStep.events.length > 0) {
    var sFields = scanSensitiveFields();
    for (var si = 0; si < sFields.length; si++) currentStep.highlights.push(sFields[si]);
    steps.push({ events: currentStep.events.slice(), highlights: currentStep.highlights.slice() });
  }

  // Immediately hide bar + blur
  closePanel();

  // Record "done" event at click time + 500ms
  var doneEvent = createEvent('lifecycle');
  doneEvent.timestamp += 500;
  doneEvent.elementText = 'done';
  doneEvent.elementRole = 'lifecycle';
  events.push(doneEvent);
  steps.push({ events: [doneEvent], highlights: scanSensitiveFields(), description: 'done' });

  console.log('[HackDemo] Sending', steps.length, 'steps,', events.length, 'events');

  chrome.runtime.sendMessage({
    type: 'RECORDING_DATA',
    events: events,
    steps: steps,
  });
}

// ── Web app → extension bridge ──
// The frontend web app sends tokens via window.postMessage and also writes
// to window.__hackdemo_auth. We pick up both to avoid race conditions.

function forwardAuthToBackground(payload) {
  if (!payload || payload.source !== 'hackdemo-web') return;

  if (payload.type === 'LOGOUT') {
    console.log('[HackDemo] Forwarding logout to background');
    chrome.runtime.sendMessage({ type: 'LOGOUT' }).catch(function () {});
    return;
  }

  if (payload.type !== 'AUTH_TOKEN' || !payload.token) return;

  console.log('[HackDemo] Forwarding auth to background');
  chrome.runtime.sendMessage({
    type: 'AUTH_TOKEN',
    token: payload.token,
    user: payload.user,
  }).catch(function () {});
}

// 1. Check DOM for pending auth data (page may have written it before we loaded).
//    DOM is shared between page and content script worlds.
var authAttr = document.documentElement.getAttribute('data-hackdemo-auth');
if (authAttr) {
  try {
    forwardAuthToBackground(JSON.parse(authAttr));
  } catch (e) { /* ignore parse errors */ }
}

// 2. Signal to the page that content script is ready.
window.postMessage({ source: 'hackdemo-cs', type: 'CS_READY' }, window.location.origin);

// 3. Listen for postMessage (for real-time auth updates from the page)
window.addEventListener('message', function (event) {
  if (event.source !== window) return;
  forwardAuthToBackground(event.data);
});

// ── Message handlers ──

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  switch (msg.type) {
    case 'TOGGLE_PANEL':
      togglePanel();
      sendResponse({ ok: true });
      break;
    case 'PANEL_UPDATE':
      updatePanelState(msg);
      sendResponse({ ok: true });
      break;
    case 'SHOW_BLUR':
      showBlur();
      sendResponse({ ok: true });
      break;
    case 'HIDE_BLUR':
      hideBlur();
      sendResponse({ ok: true });
      break;
    case 'START_TRACKING':
      startTracking(msg.recordingStartTime);
      sendResponse({ ok: true });
      break;
    case 'STOP_TRACKING':
      stopTracking();
      sendResponse({ ok: true });
      break;
    case 'PAUSE_TRACKING':
      isActive = false;
      pauseStartTime = Date.now();
      sendResponse({ ok: true });
      break;
    case 'RECORDING_START_TIME':
      recordingStartTime = msg.startTime;
      isActive = true;
      var se = createEvent('lifecycle', null);
      se.elementText = 'start'; se.elementRole = 'lifecycle'; se.timestamp = 0;
      events.push(se);
      steps.push({ events: [se], highlights: scanSensitiveFields(), description: 'start' });
      panelSteps = steps;
      chrome.runtime.sendMessage({ type: 'STEP_COUNT', count: steps.length }).catch(function () {});
      sendResponse({ ok: true });
      break;

    case 'RESUME_TRACKING':
      totalPauseMs += Date.now() - pauseStartTime;
      isActive = true;
      closePanel();
      sendResponse({ ok: true });
      break;
    case 'GET_DATA':
      console.log('[HackDemo cs] GET_DATA received, steps:', steps.length);
      stopTracking();
      sendData().then(function () {
        sendResponse({ ok: true });
      });
      return true; // async
  }
});



