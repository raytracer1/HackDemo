/**
 * 1. POST /api/demos (JSON only) → get demoId + uploadUrls
 * 2. PUT screenshots directly to R2 pre-signed URLs
 * 3. POST /api/demos/:id/confirm → trigger processing
 */
export async function uploadDemo(backendUrl, payload) {
  // Step 1: Create demo, get pre-signed upload URLs
  const stepsPayload = payload.steps.map(function (s) {
    return {
      index: s.index,
      description: s.description,
      actionType: s.actionType,
      pageContext: s.pageContext,
      startTime: s.startTime,
      endTime: s.endTime,
      highlights: s.highlights || [],
    };
  });

  const createResp = await fetch(backendUrl + '/api/demos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: payload.title,
      steps: stepsPayload,
    }),
  });

  if (!createResp.ok) {
    const text = await createResp.text().catch(function () { return 'Unknown error'; });
    throw new Error('Create demo failed: ' + createResp.status + ' ' + text);
  }

  const createData = await createResp.json();
  const demoId = createData.id;
  const uploadUrls = createData.uploadUrls;

  console.log('[HackDemo] Demo created:', demoId, 'with', uploadUrls.length, 'upload URLs');

  // Step 2: Upload screenshots directly to R2
  for (var i = 0; i < uploadUrls.length; i++) {
    var screenshot = payload.screenshots[i];
    if (!screenshot) continue;

    try {
      // Convert data URL to blob
      var resp = await fetch(screenshot);
      var blob = await resp.blob();

      // Convert data URL to blob for upload
      var resp = await fetch(screenshot);
      var blob = await resp.blob();

      // PUT directly to R2 pre-signed URL
      var putResp = await fetch(uploadUrls[i], {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': 'image/jpeg' },
      });

      if (!putResp.ok) {
        console.warn('[HackDemo] Screenshot upload failed for step', i, ':', putResp.status);
      }
    } catch (err) {
      console.warn('[HackDemo] Screenshot upload error for step', i, ':', err.message);
    }
  }

  console.log('[HackDemo] Screenshots uploaded');

  // Step 3: Confirm upload
  var confirmResp = await fetch(backendUrl + '/api/demos/' + demoId + '/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });

  if (!confirmResp.ok) {
    throw new Error('Confirm failed: ' + confirmResp.status);
  }

  return { id: demoId };
}
