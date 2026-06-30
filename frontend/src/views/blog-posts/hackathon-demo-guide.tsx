import Link from 'next/link';

export default function PostContent() {
  return (

    <article className="space-y-6 text-sm leading-relaxed text-gray-600">
      <section>
        <p className="mt-2">
          You've just spent 36 hours building something amazing. Your backend works, your frontend is polished, and your pitch slide deck is almost ready. Then you realize — <strong>you have no demo video to show the judges</strong>.
        </p>
        <p className="mt-2">
          This is the moment most hackathon teams lose. Not because their product is bad, but because they can't communicate what it does in the 3–5 minutes judges give them. A polished demo video is the highest-leverage asset you can create in the final hours of a hackathon — and with AI tools like HackDemo, it now takes <strong>under 5 minutes</strong> instead of 2 hours.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Why a Demo Video Wins Hackathons</h2>
        <p className="mt-2">Hackathon judges evaluate dozens of projects in a single day. They're tired, they're rushed, and they're making snap decisions. Here's what a demo video does for you:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><strong>It scales your pitch.</strong> Not every judge sees your live presentation. A video demo lives on your Devpost submission and gets watched during deliberation.</li>
          <li><strong>It proves it works.</strong> A screen recording of your actual product carries 10× more credibility than slide screenshots. Judges see real interactions, not mockups.</li>
          <li><strong>It tells a story.</strong> A narrated walkthrough guides judges through your user flow — problem → solution → magic moment — without them having to figure it out themselves.</li>
          <li><strong>It works async.</strong> Corporate-sponsored prizes often have separate judges reviewing submissions offline. Your video is your 24/7 salesperson.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">The Old Way: 2 Hours of Pain</h2>
        <p className="mt-2">Before AI demo tools, creating a decent product walkthrough looked like this:</p>
        <ol className="mt-2 list-decimal pl-5 space-y-1">
          <li>Record your screen with OBS or Loom (5 min)</li>
          <li>Realize you clicked the wrong button and re-record (another 5 min)</li>
          <li>Write a voiceover script so you don't ramble (20 min)</li>
          <li>Record the voiceover, re-record 4 times because your teammate is talking in the background (30 min)</li>
          <li>Import into a video editor, sync audio to video, add annotation arrows (45 min)</li>
          <li>Export, realize the file is 2 GB, re-encode (15 min)</li>
          <li>Upload to YouTube or Google Drive, hope the link works (5 min)</li>
        </ol>
        <p className="mt-2">Total: <strong>~2 hours</strong>. In a 36-hour hackathon, that's 5.5% of your total time — spent not building, not designing, not preparing for Q&A.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">The HackDemo Way: Under 5 Minutes</h2>
        <p className="mt-2">Here's the workflow that hackathon winners use:</p>

        <h3 className="mt-4 font-semibold text-gray-800">Step 1: Install the Extension (30 seconds)</h3>
        <p className="mt-1">Add the{' '}<a href="https://chromewebstore.google.com/detail/hackdemo-%E2%80%94-ai-demo-record/dlkbndgmhlmddbihhjilapjncpbenhkj" target="_blank" rel="noopener noreferrer" className="text-hack-primary hover:underline">HackDemo Chrome extension</a>. No config, no API keys, no setup wizard. Sign in with Google and you're ready.</p>

        <h3 className="mt-4 font-semibold text-gray-800">Step 2: Record Your Flow (1–2 minutes)</h3>
        <p className="mt-1">Click "Start Capture" and walk through your product's key user journey. Don't worry about perfection — HackDemo detects every click, input, and page navigation automatically. Focus on showing the <strong>problem → solution path</strong> that judges care about.</p>
        <p className="mt-1"><strong>Pro tip:</strong> Record the "before" state too — show the problem your product solves, then show your solution in action. This contrast is what wins pitches.</p>

        <h3 className="mt-4 font-semibold text-gray-800">Step 3: Let AI Do the Narration (30–60 seconds)</h3>
        <p className="mt-1">Click "Done" and HackDemo's AI takes over. DeepSeek analyzes your recorded steps and generates a step-by-step narration script. Google TTS produces the voiceover in your chosen language. Visual annotations — click markers, input highlights, scroll indicators — are applied automatically.</p>
        <p className="mt-1"><strong>Pro tip:</strong> Review the AI-generated narration and tweak any step. Add your team name, mention the tech stack, or highlight the innovation that makes your project special. The text is fully editable before export.</p>

        <h3 className="mt-4 font-semibold text-gray-800">Step 4: Export MP4 and Submit (30 seconds)</h3>
        <p className="mt-1">One click exports a polished MP4. Upload to Devpost as your demo video, add the link to your pitch deck, or play it directly during judge presentations. The file is optimized for web sharing — no 2 GB monsters.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">What Makes a Winning Hackathon Demo</h2>
        <p className="mt-2">After analyzing dozens of winning Devpost submissions, here are the patterns that separate winning demos from the rest:</p>

        <h3 className="mt-4 font-semibold text-gray-800">1. Start with the Problem (15 seconds)</h3>
        <p className="mt-1">Don't jump straight into your product. Spend the first 15 seconds showing the problem. Judges need context. "Managing cloud costs across three providers is a nightmare — here's what it looks like today."</p>

        <h3 className="mt-4 font-semibold text-gray-800">2. Show One Clear User Journey</h3>
        <p className="mt-1">Don't demo every feature. Pick <strong>one</strong> user journey that demonstrates your core value prop. A 2-minute focused demo beats a 5-minute feature dump every time. Judges can always explore more features on their own if they're interested.</p>

        <h3 className="mt-4 font-semibold text-gray-800">3. Highlight the "Magic Moment"</h3>
        <p className="mt-1">Every great hackathon project has a moment where it clicks — the AI generates a response, the visualization renders, the automation triggers. Make sure this moment is <strong>annotated and emphasized</strong> in your video. HackDemo's auto-annotations handle this for you.</p>

        <h3 className="mt-4 font-semibold text-gray-800">4. Keep It Under 3 Minutes</h3>
        <p className="mt-1">The most common feedback from hackathon judges: "demos are too long." Aim for <strong>90–150 seconds</strong>. If you can't explain your product's value in 2 minutes, you haven't distilled it enough. Record multiple takes if needed — each one costs pennies in AI credits.</p>

        <h3 className="mt-4 font-semibold text-gray-800">5. Add Narration — Don't Rely on Music</h3>
        <p className="mt-1">A silent screen recording set to lo-fi beats doesn't explain anything. AI narration costs ~$0.03 per demo and adds enormous value. Judges who watch your video during deliberation (often without audio from your live pitch) need the narration to understand what's happening.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Real Hackathon Scenario: The Last 2 Hours</h2>
        <p className="mt-2">Here's how a typical winning team uses HackDemo in the final stretch:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><strong>T-2:00:</strong> Core feature is working. One teammate starts recording the demo while others fix bugs and prepare slides.</li>
          <li><strong>T-1:55:</strong> Recording done. AI processing begins. Team reviews the generated narration and tweaks two steps.</li>
          <li><strong>T-1:50:</strong> MP4 exported. Video is uploaded to Devpost as a private/unlisted link. The demo is <em>done</em>.</li>
          <li><strong>T-1:00:</strong> Team rehearses the live pitch, referencing the demo video for timing and narrative flow. No one is frantically editing in iMovie.</li>
          <li><strong>T-0:05:</strong> Submission deadline. Demo video is polished, narrated, and already attached to the Devpost submission.</li>
        </ul>
        <p className="mt-2">Compare this to the team that starts recording at T-0:45, has no narration, and submits a silent screen recording with "we'll add voiceover later" in the description. <strong>Same product, radically different judge experience.</strong></p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Multi-Language Demos for Global Hackathons</h2>
        <p className="mt-2">
          Competing in a hackathon with international judges? HackDemo supports <strong>20+ languages</strong> for AI narration — English, Chinese, Japanese, Korean, Spanish, French, German, Portuguese, and more. Record once, generate narrations in multiple languages if needed.
        </p>
        <p className="mt-2">
          This is especially valuable for events like lablab.ai, Devpost hackathons with global sponsors, or any competition where judges may not be native English speakers. A demo narrated in the judge's language signals effort and respect.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Privacy: Share Without Leaking Secrets</h2>
        <p className="mt-2">
          Hackathon demos often get shared publicly — on Devpost, Twitter, LinkedIn, and GitHub. HackDemo's <strong>auto-blur feature</strong> detects and obscures API keys, passwords, email addresses, and other sensitive information in your recording. You can share your demo confidently without worrying about accidentally exposing credentials.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">What Judges Actually Look For</h2>
        <p className="mt-2">Based on judge criteria from major hackathons (MLH, Devpost, lablab.ai), here's what your demo video should communicate:</p>
        <div className="mt-2 overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 font-semibold text-gray-900">Criterion</th>
                <th className="px-4 py-2 font-semibold text-gray-900">What to Show in Your Demo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2 font-medium text-gray-700">Innovation</td>
                <td className="px-4 py-2">The "how did they do that?" moment. Annotate the technical highlight.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium text-gray-700">Impact</td>
                <td className="px-4 py-2">Show the problem first, then the solution. Make the contrast visible.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium text-gray-700">Execution</td>
                <td className="px-4 py-2">Demonstrate a working product, not wireframes. Real clicks, real data.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium text-gray-700">UX / Design</td>
                <td className="px-4 py-2">Smooth flow, visual polish. HackDemo annotations highlight the journey.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium text-gray-700">Presentation</td>
                <td className="px-4 py-2">Clear narration, logical flow, professional delivery. AI handles this.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">The Bottom Line</h2>
        <p className="mt-2">
          Hackathons are won and lost in the presentation. You can build the most technically impressive project in the room, but if judges can't understand what it does in 2 minutes, you won't win. A narrated, annotated demo video is the single highest-ROI asset you can create in the final hours.
        </p>
        <p className="mt-2">
          With AI tools like HackDemo, creating a professional demo now takes <strong>under 5 minutes</strong> — less time than it takes to brew a pot of hackathon coffee. There's no reason to submit a silent screen recording ever again.
        </p>
      </section>

      <section>
        <p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm">
          <strong>Win your next hackathon with a pitch-ready demo —</strong> new users get <strong>$0.50 free</strong> credits, enough for your first fully-narrated demo. No credit card required.{' '}
          <a href="https://chromewebstore.google.com/detail/hackdemo-%E2%80%94-ai-demo-record/dlkbndgmhlmddbihhjilapjncpbenhkj" target="_blank" rel="noopener noreferrer" className="font-medium text-hack-primary hover:underline">Start free →</a>
        </p>
      </section>
    </article>
  );
}
