/**
 * @param {string} type
 * @returns {string}
 */
function icon(type) {
  switch (type) {
    case 'navigation': return '\u{1F517}';
    case 'form_fill':  return '\u{1F4DD}';
    case 'form_submit': return '\u{2705}';
    case 'click':      return '\u{1F446}';
    default:           return '\u{1F3AF}';
  }
}

/**
 * @param {number} ms
 * @returns {string}
 */
function fmt(ms) {
  return Math.floor(ms / 1000) + 's';
}

/**
 * @param {Object[]} steps
 * @returns {HTMLElement}
 */
export function createStepPreview(steps) {
  var container = document.createElement('div');
  container.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

  var hdr = document.createElement('h3');
  hdr.className = 'step-header';
  hdr.textContent = 'Demo Steps (' + steps.length + ')';
  container.appendChild(hdr);

  var list = document.createElement('div');
  list.className = 'step-list';

  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    var card = document.createElement('div');
    card.className = 'step-card';

    var icn = document.createElement('span');
    icn.className = 'step-card-icon';
    icn.textContent = icon(step.actionType);
    card.appendChild(icn);

    var body = document.createElement('div');
    body.className = 'step-card-body';

    var desc = document.createElement('div');
    desc.className = 'step-card-desc';
    desc.textContent = step.description;
    body.appendChild(desc);

    if (step.narration) {
      var narr = document.createElement('div');
      narr.className = 'step-card-narr';
      narr.textContent = step.narration;
      body.appendChild(narr);
    }

    card.appendChild(body);

    var time = document.createElement('span');
    time.className = 'step-card-time';
    time.textContent = fmt(step.startTime);
    card.appendChild(time);

    list.appendChild(card);
  }

  container.appendChild(list);
  return container;
}
