import Link from 'next/link';

export default function PostContent() {
  return (
    <article className="space-y-6 text-sm leading-relaxed text-gray-600">
      <section>
        <h2 className="text-lg font-semibold text-gray-900">Why We Built HackDemo</h2>
        <p className="mt-2">
          Creating product demo videos is painful. Every hackathon, every product launch, every feature walkthrough — you spend 30 minutes recording, then 3 hours editing. Guidde showed us that browser-to-demo automation is possible, but at <strong>$20–$50/month per seat</strong>, it's out of reach for indie developers, small teams, and startups watching every dollar.
        </p>
        <p className="mt-2">
          So we built HackDemo — a tool that delivers <strong>80% of Guidde's functionality at less than 1% of the cost</strong>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Head-to-Head Comparison</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 pr-4 font-semibold text-gray-900">Feature</th>
                <th className="py-2 pr-4 font-semibold text-hack-primary">HackDemo</th>
                <th className="py-2 font-semibold text-gray-400">Guidde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ['Browser recording', '✅ Free, unlimited', '✅ Included in plan'],
                ['AI narration', '✅ Pay-per-use (~$0.03/demo)', '✅ Included'],
                ['Voiceover (TTS)', '✅ 20+ languages', '✅ Multiple languages'],
                ['MP4 export', '✅ Free', '✅ Included'],
                ['Step annotations', '✅ Auto-generated', '✅ Auto-generated'],
                ['Sensitive info blur', '✅ Auto-detect + blur', '✅ Auto-blur'],
                ['Free to start', '✅ $0.50 credits (~150 demos)', '14-day free trial'],
                ['Pricing', '~$0.03 per demo*', '$20–$50/user/month'],
              ].map(([feature, hackdemo, guidde]) => (
                <tr key={feature}>
                  <td className="py-3 pr-4 font-medium text-gray-700">{feature}</td>
                  <td className={`py-3 pr-4 ${feature === 'Pricing' ? 'font-bold text-hack-primary' : ''}`}>{hackdemo}</td>
                  <td className={`py-3 ${feature === 'Pricing' ? 'font-bold text-gray-400' : ''}`}>{guidde}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-gray-400">* Based on ~3,000 tokens per demo at $0.00001/token. Actual cost varies by demo complexity.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Where HackDemo Wins</h2>
        <div className="mt-2 space-y-4">
          <div><h3 className="font-semibold text-gray-800">💰 Pay Only for What You Use</h3><p>Guidde charges per seat, per month — whether you record 1 demo or 100. HackDemo charges per AI token, so a light user might pay <strong>$0.50/month</strong> while a heavy user pays ~$9.90. No fixed subscription means <strong>you're never overpaying</strong>.</p></div>
          <div><h3 className="font-semibold text-gray-800">🌍 20+ Languages, Same Price</h3><p>Guidde supports multiple languages but bundles them into premium tiers. HackDemo generates narration in English, Chinese, Japanese, Korean, Spanish, French, German, and 15+ more — <strong>all at the same per-token rate</strong>.</p></div>
          <div><h3 className="font-semibold text-gray-800">🔓 Open Stack, No Vendor Lock-In</h3><p>Your demos are stored on <strong>Cloudflare R2</strong>, your data in <strong>PostgreSQL</strong>. You can export everything, run your own worker, or self-host. Guidde is a closed SaaS — your data stays on their servers with no self-hosted option.</p></div>
          <div><h3 className="font-semibold text-gray-800">🎯 Built for Developers & Indie Makers</h3><p>HackDemo was built for hackathon participants, indie developers, and small teams who need quick, professional demo videos without the enterprise price tag. Guidde targets large teams with training budgets — a different audience entirely.</p></div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Where Guidde Still Leads</h2>
        <p className="mt-2">To be fair, Guidde has been around longer and has features we're still building:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><strong>Team collaboration:</strong> shared workspaces, comments, approval workflows</li>
          <li><strong>Advanced editing:</strong> drag-and-drop step reordering, custom branding</li>
          <li><strong>Integrations:</strong> native Slack, Notion, Confluence connectors</li>
          <li><strong>Analytics:</strong> view tracking, engagement metrics</li>
        </ul>
        <p className="mt-2">These are on our roadmap, but we believe the <strong>80/20 rule</strong> applies: most users need the core recording + narration + export flow, and HackDemo delivers that at a fraction of the cost.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">The Bottom Line</h2>
        <p className="mt-2">If you're an enterprise team with a dedicated training budget and need collaboration features, Guidde is a solid choice. But if you're an indie developer, a startup founder, or a hackathon participant who just wants to <strong>record a workflow and get a professional demo video in 30 seconds</strong>, HackDemo gives you the same core quality at less than 1% of the cost.</p>
        <p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm"><strong>Try HackDemo free —</strong> new users get <strong>$0.50 in credits</strong>, enough for 150+ AI-narrated demos. No credit card required.{' '}<Link href="/login" className="font-medium text-hack-primary hover:underline">Get started →</Link></p>
      </section>
    </article>
  );
}
