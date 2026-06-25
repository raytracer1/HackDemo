import type { Highlight } from '../shared/types';

const COLORS: Record<string, { border: string; fill: string; label: string }> = {
  click:  { border: '#6366f1', fill: 'rgba(99, 102, 241, 0.12)', label: '#6366f1' },
  input:  { border: '#22c55e', fill: 'rgba(34, 197, 94, 0.08)',  label: '#22c55e' },
  submit: { border: '#6366f1', fill: 'rgba(99, 102, 241, 0.15)', label: '#6366f1' },
};

function colorsFor(h: Highlight) {
  if (h.type === 'submit') return COLORS.submit;
  if (h.type === 'input') return COLORS.input;
  return COLORS.click;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Draw UI annotations (highlight boxes, click indicators, labels) on a screenshot.
 *
 * `boundingRect` coordinates are relative to the viewport at capture time.
 * The screenshot image is assumed to match the viewport 1:1 (a full-page
 * screenshot would need different scaling, but captureVisibleTab captures
 * only the visible viewport).
 */
export async function annotateScreenshot(
  screenshotDataUrl: string,
  highlights: Highlight[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context failed')); return; }

      // Draw original screenshot
      ctx.drawImage(img, 0, 0);

      // Scale: screenshot dimensions vs viewport
      const viewportW = window.innerWidth || 1280;
      const viewportH = window.innerHeight || 720;
      const scaleX = canvas.width / viewportW;
      const scaleY = canvas.height / viewportH;

      for (const h of highlights) {
        if (!h.boundingRect || h.boundingRect.width <= 0) continue;

        const c = colorsFor(h);

        let x = h.boundingRect.left * scaleX;
        let y = h.boundingRect.top * scaleY;
        let w = h.boundingRect.width * scaleX;
        let hh = h.boundingRect.height * scaleY;

        // Minimum size
        if (w < 20) w = 20;
        if (hh < 16) hh = 16;

        const pad = 6;
        x = Math.max(0, x - pad);
        y = Math.max(0, y - pad);
        w = Math.min(canvas.width - x, w + pad * 2);
        hh = Math.min(canvas.height - y, hh + pad * 2);

        // Fill highlight
        ctx.fillStyle = c.fill;
        roundRect(ctx, x, y, w, hh, 6);
        ctx.fill();

        // Border
        ctx.strokeStyle = c.border;
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, w, hh, 6);
        ctx.stroke();

        // Click dot indicator
        if (h.type === 'click' || h.type === 'submit') {
          const cx = h.boundingRect.left * scaleX + (h.boundingRect.width * scaleX) / 2;
          const cy = h.boundingRect.top * scaleY + (h.boundingRect.height * scaleY) / 2;

          ctx.strokeStyle = c.border;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, 14, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = c.border;
          ctx.beginPath();
          ctx.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Label
        if (h.elementText && h.elementText.length < 30) {
          const fontSize = 13;
          ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
          ctx.textBaseline = 'bottom';

          let text = h.elementText;
          if (h.type === 'input') text = 'Enter: ' + text;
          if (h.type === 'submit') text = 'Submit';

          const textW = ctx.measureText(text).width;
          let labelX = x;
          let labelY = y - 4;
          if (labelY < 0) labelY = y + hh + fontSize + 8;

          const lpad = 4;
          ctx.fillStyle = c.border;
          roundRect(ctx, labelX, labelY - fontSize - lpad, textW + lpad * 2, fontSize + lpad * 2, 4);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, labelX + lpad, labelY);
        }
      }

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load screenshot image'));
    img.src = screenshotDataUrl;
  });
}
