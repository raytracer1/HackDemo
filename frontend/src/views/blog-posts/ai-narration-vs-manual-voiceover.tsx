import Link from 'next/link';

export default function PostContent() {
  return (

    <article className="space-y-6 text-sm leading-relaxed text-gray-600">
      <section>
        <p className="mt-2">
          Voiceover can make or break a product demo. A clear, well-paced narration keeps viewers engaged — but recording it manually is slow, expensive, and hard to update. <strong>AI text-to-speech (TTS) narration</strong> has improved so dramatically that it's now the better choice for most demo creators. Here's the data.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Speed: AI Is 10× Faster</h2>
        <p className="mt-2">Recording a manual voiceover for a 3-minute demo typically takes <strong>20–30 minutes</strong> — you need a quiet environment, multiple takes to fix mistakes, and often a re-record when the product changes. AI narration generates the entire voiceover in <strong>under 30 seconds</strong>, and you can regenerate it instantly if you update the demo.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Cost: AI Is 50–100× Cheaper</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-4 font-semibold text-gray-900">Cost Factor</th>
                <th className="py-2 pr-4 font-semibold text-hack-primary">AI Narration</th>
                <th className="py-2 font-semibold text-gray-400">Manual Voiceover</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['Per 3-min demo', '~$0.03', '$50–$200 (freelancer)'],
                ['Equipment', '$0 (no mic needed)', '$100–$500 (mic, pop filter, room treatment)'],
                ['Re-recordings', 'Free — regenerate instantly', 'Full cost each time'],
                ['Multi-language', 'Same per-token rate', '$50–$200 per language'],
              ].map(([factor, ai, manual]) => (
                <tr key={factor}>
                  <td className="py-3 pr-4 font-medium text-gray-700">{factor}</td>
                  <td className="py-3 pr-4 font-medium text-hack-primary">{ai}</td>
                  <td className="py-3 text-gray-400">{manual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Quality: AI Has Closed the Gap</h2>
        <p className="mt-2">Modern TTS models (like the ones HackDemo uses) produce speech that's <strong>nearly indistinguishable from human voiceovers</strong> for instructional content. They handle pacing, intonation, and pronunciation better than ever. Unless your demo needs an emotional, narrative delivery (like a brand film), AI quality is more than sufficient.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Multi-Language: AI's Killer Feature</h2>
        <p className="mt-2">If you need your demo in English, Japanese, Spanish, and German, AI does it <strong>at the same per-token cost</strong>. Manual voiceover requires hiring native speakers for each language — multiplying cost and turnaround time. HackDemo supports <strong>20+ languages</strong> out of the box. Check our <Link href="/help" className="text-hack-primary hover:underline">help page</Link> for the full language list.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">When Manual Voiceover Still Makes Sense</h2>
        <p className="mt-2">AI isn't perfect for every scenario. If your demo is a high-budget marketing video, a brand anthem, or requires a specific celebrity-like voice, manual recording is still the way to go. But for <strong>product walkthroughs, onboarding videos, how-to tutorials, and feature announcements</strong>, AI narration is the pragmatic choice.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Getting Started With AI Narration</h2>
        <p className="mt-2">HackDemo integrates AI narration directly into the recording workflow — record your browser actions, and the platform <strong>automatically generates step-by-step narration</strong> synced to each click. No scripting, no recording booth, no editing.</p>
        <p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm"><strong>Try AI narration free —</strong> new users get <strong>$0.50 in credits</strong>, enough for 150+ narrated demos.{' '}<Link href="/login" className="font-medium text-hack-primary hover:underline">Start recording →</Link></p>
      </section>
    </article>
  );
}

