import { STEP_MERGE_WINDOW_MS } from '../shared/constants.js';

// ── Grouping ──

function shouldStartNewGroup(event, currentGroup, prevEvent) {
  if (event.type === 'navigation' || event.type === 'page_load') return true;

  const hasTerminal = currentGroup.some(function (e) {
    return e.type === 'submit' || e.type === 'navigation';
  });
  if (hasTerminal) return true;

  const gap = event.timestamp - prevEvent.timestamp;
  if (gap > STEP_MERGE_WINDOW_MS) {
    if (event.type === 'input' || prevEvent.type === 'input') {
      if (gap < 5000) return false;
    }
    return true;
  }

  if (event.type === 'submit') return true;
  return false;
}

function classifyGroup(events) {
  var types = new Set(events.map(function (e) { return e.type; }));
  if (types.has('submit')) return 'form_submit';
  if (types.has('input') && types.size >= 2) return 'form_fill';
  if (types.has('input')) return 'form_fill';
  if (types.has('navigation') || types.has('page_load')) return 'navigation';
  if (types.has('click') && types.size === 1) return 'click';
  return 'mixed';
}

function generateDescription(events) {
  if (events.length === 0) return 'Unknown action';
  if (events.length === 1) {
    var e = events[0];
    switch (e.type) {
      case 'click':      return 'Clicked "' + e.elementText + '"';
      case 'input':      return 'Entered text in "' + e.elementText + '"';
      case 'submit':     return 'Submitted form';
      case 'navigation': return 'Navigated to ' + e.pageTitle;
      case 'page_load':  return 'Loaded ' + e.pageTitle;
      default: return e.type + ' on ' + e.pageTitle;
    }
  }

  var types = new Set(events.map(function (e) { return e.type; }));
  var clicks = events.filter(function (e) { return e.type === 'click'; });
  var inputs = events.filter(function (e) { return e.type === 'input'; });
  var submits = events.filter(function (e) { return e.type === 'submit'; });

  if (submits.length > 0 && (inputs.length > 0 || clicks.length > 0)) {
    var n = inputs.length + clicks.length;
    return 'Filled in ' + n + ' ' + (n === 1 ? 'field' : 'fields') + ' and submitted';
  }

  if (clicks.length === events.length && clicks.length <= 3) {
    return 'Clicked ' + clicks.map(function (c) { return '"' + c.elementText + '"'; }).join(', ');
  }

  if (clicks.length === events.length) return 'Performed ' + clicks.length + ' clicks';

  if (types.has('input') && types.has('click')) {
    var lc = clicks[clicks.length - 1];
    return 'Filled in fields and clicked "' + lc.elementText + '"';
  }

  return 'Performed ' + events.length + ' actions';
}

// ── Screenshot assignment ──

/**
 * Find the closest screenshot to a given time.
 * @param {Array<{ time: number, dataUrl: string }>} screenshots
 * @param {number} targetTime
 * @returns {string|null}
 */
function findClosestScreenshot(screenshots, targetTime) {
  if (screenshots.length === 0) return null;

  var best = screenshots[0];
  var bestDist = Math.abs(best.time - targetTime);

  for (var i = 1; i < screenshots.length; i++) {
    var dist = Math.abs(screenshots[i].time - targetTime);
    if (dist < bestDist) {
      bestDist = dist;
      best = screenshots[i];
    }
  }

  return best.dataUrl;
}

// ── Highlight data extraction ──

/**
 * Extract highlight annotations from events within a step.
 * Filters out navigation/page_load events (no DOM element).
 * @param {Object[]} events
 * @returns {Object[]}
 */
function extractHighlights(events) {
  return events
    .filter(function (e) {
      return e.boundingRect && e.boundingRect.width > 0 && e.boundingRect.height > 0;
    })
    .map(function (e) {
      return {
        type: e.type,
        elementText: e.elementText,
        elementRole: e.elementRole,
        boundingRect: e.boundingRect,
      };
    });
}

// ── Main ──

/**
 * Convert RawEvent[] → DemoStep[], assigning screenshots by timestamp.
 * @param {Object[]} events
 * @param {Array<{ time: number, dataUrl: string }>} screenshots
 * @returns {Object[]}
 */
export function generateSteps(events, screenshots) {
  if (events.length === 0) return [];

  var ss = screenshots || [];

  // Phase 1: segment events into groups
  var groups = [];
  var currentGroup = [events[0]];

  for (var i = 1; i < events.length; i++) {
    var event = events[i];
    var prevEvent = events[i - 1];

    if (shouldStartNewGroup(event, currentGroup, prevEvent)) {
      groups.push(currentGroup);
      currentGroup = [event];
    } else {
      currentGroup.push(event);
    }
  }
  groups.push(currentGroup);

  // Phase 2: convert groups to steps with screenshots and highlights
  return groups.map(function (group, index) {
    var startTime = group[0].timestamp;
    var endTime = group[group.length - 1].timestamp;
    var lastEvent = group[group.length - 1];

    return {
      index: index,
      events: group,
      startTime: startTime,
      endTime: endTime,
      description: generateDescription(group),
      actionType: classifyGroup(group),
      screenshot: findClosestScreenshot(ss, startTime),
      highlights: extractHighlights(group),
      pageContext: {
        title: lastEvent.pageTitle,
        url: lastEvent.url,
      },
    };
  });
}
