/**
 * 1. POST /api/demos (JSON) → get demoId + uploadUrls
 * 2. Return demoId immediately (for opening frontend)
 * 3. Upload screenshots + confirm in background
 */
export async function uploadDemo(backendUrl, payload) {
  // Step 1: Create demo, get pre-signed upload URLs
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
    body: JSON.stringify({ title: payload.title, steps: stepsPayload }),
  });

  if (!createResp.ok) {
    var text = await createResp.text().catch(function () { return 'Unknown error'; });
    throw new Error('Create demo failed: ' + createResp.status + ' ' + text);
  }

  var createData = await createResp.json();
  var demoId = createData.id;
  var uploadUrls = createData.uploadUrls;

  console.log('[HackDemo] Demo created:', demoId);

  // Step 2-3: Upload screenshots + confirm in background (don't block)
  uploadAndConfirm(backendUrl, demoId, uploadUrls, payload.screenshots);

  return { id: demoId };
}

async function uploadAndConfirm(backendUrl, demoId, uploadUrls, screenshots) {
  for (var i = 0; i < uploadUrls.length; i++) {
    var screenshot = screenshots[i];
    if (!screenshot) continue;
    try {
      var resp = await fetch(screenshot);
      var blob = await resp.blob();

      await fetch(uploadUrls[i], {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' },
      });
    } catch (err) {
      console.warn('[HackDemo] Upload failed for step', i, ':', err.message);
    }
  }

  console.log('[HackDemo] Screenshots uploaded, confirming...');

  try {
    await fetch(backendUrl + '/api/demos/' + demoId + '/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    console.log('[HackDemo] Demo confirmed');
  } catch (err) {
    console.warn('[HackDemo] Confirm failed:', err.message);
  }
}
