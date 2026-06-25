const MAX_EVENTS = 10000;

/**
 * Append a raw event to the session buffer.
 * @param {Object|null} session
 * @param {Object} event
 */
export function handleContentEvent(session, event) {
  if (!session || session.state !== 'recording') return;
  if (session.events.length >= MAX_EVENTS) return;

  // Filter noise
  if (event.elementRole === 'body' || event.elementRole === 'html') return;
  if (!event.elementText && event.type !== 'navigation' && event.type !== 'page_load') return;

  session.events.push(event);
}
