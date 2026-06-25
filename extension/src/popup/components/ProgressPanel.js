var PHASES = ['Upload', 'Narration', 'Voice', 'Export'];

/**
 * @param {string} phase
 * @param {{ phase: string, percent: number }} progress
 * @returns {HTMLElement}
 */
export function createProgressPanel(phase, progress) {
  var container = document.createElement('div');
  container.className = 'progress-section';

  var label = document.createElement('div');
  label.className = 'progress-label';
  label.textContent = progress.phase || 'Processing...';
  container.appendChild(label);

  // bar
  var outer = document.createElement('div');
  outer.className = 'progress-bar-outer';
  var inner = document.createElement('div');
  inner.className = 'progress-bar-inner';
  inner.style.width = Math.min(progress.percent, 100) + '%';
  outer.appendChild(inner);
  container.appendChild(outer);

  // dots
  var dots = document.createElement('div');
  dots.className = 'progress-dots';

  var currentIdx = progress.phase
    ? PHASES.findIndex(function (p) { return progress.phase.toLowerCase().includes(p.toLowerCase()); })
    : 0;

  for (var i = 0; i < PHASES.length; i++) {
    var col = document.createElement('div');
    col.className = 'progress-dot-col';

    var dot = document.createElement('div');
    dot.className = 'progress-dot';
    if (i < currentIdx) dot.className += ' done';
    else if (i === (currentIdx >= 0 ? currentIdx : 0)) dot.className += ' active';
    col.appendChild(dot);

    var lbl = document.createElement('span');
    lbl.className = 'progress-dot-label';
    lbl.textContent = PHASES[i];
    col.appendChild(lbl);

    dots.appendChild(col);
  }

  container.appendChild(dots);
  return container;
}
