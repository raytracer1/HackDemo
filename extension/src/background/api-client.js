/**
 * Upload demo steps + screenshots to backend.
 * @param {string} backendUrl
 * @param {{ title: string, steps: Object[], screenshots: string[] }} payload
 * @returns {Promise<{ id: string, status: string }>}
 */
export async function uploadDemo(backendUrl, payload) {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('steps', JSON.stringify(payload.steps));

  for (let i = 0; i < payload.screenshots.length; i++) {
    const dataUrl = payload.screenshots[i];
    if (dataUrl) {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      formData.append('screenshots', blob, 'step_' + i + '.png');
    }
  }

  const resp = await fetch(backendUrl + '/api/demos', {
    method: 'POST',
    body: formData,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(function () { return 'Unknown error'; });
    throw new Error('Upload failed: ' + resp.status + ' ' + text);
  }

  return resp.json();
}

/**
 * Fetch demo from backend.
 * @param {string} backendUrl
 * @param {string} demoId
 * @returns {Promise<Object>}
 */
export async function fetchDemo(backendUrl, demoId) {
  const resp = await fetch(backendUrl + '/api/demos/' + demoId);

  if (!resp.ok) {
    const text = await resp.text().catch(function () { return 'Unknown error'; });
    throw new Error('Fetch failed: ' + resp.status + ' ' + text);
  }

  return resp.json();
}
