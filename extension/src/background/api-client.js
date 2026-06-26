/**
 * 1. POST /api/demos (JSON) → get demoId + pre-signed upload URLs
 * 2. Return demoId immediately (for opening frontend tab)
 * 3. Upload screenshots + confirm in background
 */
export async function uploadDemo(backendUrl, payload) {
  var stepsPayload = payload.steps.map(function (s) {
    return {
      index: s.index, description: s.description, actionType: s.actionType,
      pageContext: s.pageContext, startTime: s.startTime, endTime: s.endTime,
      highlights: s.highlights || [],
    };
  });

  var createResp = await fetch(backendUrl + '/api/demos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: payload.title, steps: stepsPayload, language: payload.language, demoType: payload.demoType }),
  });

  if (!createResp.ok) {
    throw new Error('Create demo failed: ' + createResp.status);
  }

  var createData = await createResp.json();
  var demoId = createData.id;
  console.log('[HackDemo] Demo created:', demoId);

  // Upload screenshots + confirm in background (don't block)
  uploadInBackground(backendUrl, demoId, createData.uploadUrls, payload.screenshots);

  return { id: demoId };
}

async function uploadInBackground(backendUrl, demoId, uploadUrls, screenshots) {
  for (var i = 0; i < uploadUrls.length; i++) {
    var screenshot = screenshots[i];
    if (!screenshot) continue;
    try {
      var resp = await fetch(screenshot);
      var blob = await resp.blob();
      await fetch(uploadUrls[i], { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/jpeg' } });
    } catch (err) {
      console.warn('[HackDemo] Upload failed for step', i);
    }
  }
  console.log('[HackDemo] Screenshots uploaded');

  await fetch(backendUrl + '/api/demos/' + demoId + '/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  console.log('[HackDemo] Demo confirmed');
}
