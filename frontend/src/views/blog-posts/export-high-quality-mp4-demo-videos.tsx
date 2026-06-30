import Link from 'next/link';

export default function PostContent() {
  return (

    <article className="space-y-6 text-sm leading-relaxed text-gray-600">
      <section>
        <p className="mt-2">
          You've recorded a great product demo. But when you upload it, the text is blurry and the UI elements are unreadable. The culprit is almost always <strong>wrong export settings</strong>. Here's exactly how to export crisp, professional demo videos — whether you're using HackDemo's built-in exporter or a manual FFmpeg pipeline.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Resolution: Always Export at 1080p</h2>
        <p className="mt-2"><strong>Recommendation: 1920×1080 (Full HD).</strong></p>
        <p className="mt-2">Product demos contain text — button labels, menu items, input fields. At 720p, small UI text becomes illegible, especially on mobile screens. 4K is overkill and produces massive files. <strong>1080p is the sweet spot</strong>: sharp text, reasonable file sizes, and universal playback support.</p>
        <p className="mt-2">If your screen recording is captured at a different resolution (e.g., a 1440p monitor), scale it to 1920×1080 during export — don't change the aspect ratio mid-video.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Bitrate: The #1 Setting That Determines Quality</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-4 font-semibold text-gray-900">Use Case</th>
                <th className="py-2 pr-4 font-semibold text-gray-900">Recommended Bitrate (H.264)</th>
                <th className="py-2 font-semibold text-gray-900">File Size (3 min)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['Web sharing (social media)', '5–8 Mbps', '~110–180 MB'],
                ['Embedded on landing page', '8–12 Mbps', '~180–270 MB'],
                ['Download / archive quality', '12–16 Mbps', '~270–360 MB'],
              ].map(([use, bitrate, size]) => (
                <tr key={use}>
                  <td className="py-3 pr-4 font-medium text-gray-700">{use}</td>
                  <td className="py-3 pr-4 text-sm">{bitrate}</td>
                  <td className="py-3 text-sm text-gray-400">{size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2">For product demos embedded on your landing page, <strong>8–10 Mbps is the recommended target</strong>. It balances visual quality with fast loading times for viewers.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Codec: H.264 vs H.265</h2>
        <p className="mt-2"><strong>Use H.264 for maximum compatibility.</strong> H.265 (HEVC) produces ~30% smaller files at the same quality, but it's not universally supported in browsers yet — Safari supports it, Chrome and Firefox have inconsistent support. For a demo you're sending to customers, H.264 ensures it plays everywhere.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Frame Rate: 30 FPS Is Enough</h2>
        <p className="mt-2">Product demos are not action movies. Screen content changes slowly — clicks, scrolls, typing. <strong>30 FPS is perfectly smooth</strong> for demo videos and produces smaller files than 60 FPS. Only use 60 FPS if your demo involves smooth animations or drag-and-drop interactions where fluidity matters.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Audio: Don't Overlook the Soundtrack</h2>
        <p className="mt-2">If your demo includes AI narration or voiceover, encode audio at <strong>AAC 128 kbps</strong>. This is the standard for web video — it preserves voice clarity without bloating the file. For demos without narration, consider adding background music at a low volume to keep the video engaging.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">FFmpeg Command for Manual Export</h2>
        <p className="mt-2">If you're exporting manually, here's the FFmpeg command that produces optimal results:</p>
        <pre className="mt-2 rounded-lg bg-gray-900 p-4 text-xs text-green-400 overflow-x-auto">
{`ffmpeg -i input.mov \\
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \\
  -c:v libx264 -preset medium -crf 20 -b:v 8M \\
  -c:a aac -b:a 128k \\
  -r 30 \\
  output.mp4`}
        </pre>
        <p className="mt-2 text-xs text-gray-400"><code>-crf 20</code> is the quality setting (lower = better, 18–23 is the sweet spot). <code>-preset medium</code> balances encoding speed with compression efficiency.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">The HackDemo Approach: One-Click Export</h2>
        <p className="mt-2">HackDemo handles all of this automatically. When you click "Generate Video" on your demo page, the platform applies optimized FFmpeg settings — 1080p resolution, H.264 encoding, 30 FPS, AAC audio — and delivers a web-optimized MP4 ready to share or embed. No manual configuration required.</p>
        <p className="mt-2">If you need <Link href="/blog/how-to-create-product-demo-best-practices" className="text-hack-primary hover:underline">more demo creation tips</Link>, check our best practices guide for the full workflow.</p>
        <p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm"><strong>Export your first demo free —</strong> new users get <strong>$0.50 in credits</strong>. No credit card required.{' '}<a href="https://chromewebstore.google.com/detail/hackdemo-%E2%80%94-ai-demo-record/dlkbndgmhlmddbihhjilapjncpbenhkj" target="_blank" rel="noopener noreferrer" className="font-medium text-hack-primary hover:underline">Get started →</a></p>
      </section>
    </article>
  );
}

