# HackDemo

Record your browser workflow and turn clicks into narrated, annotated demo videos with AI.

## Inspiration

Everytime I participate in a hackathon, after the project is built, I need to spend two or three hours to generate a demo video. That is such painful. I found a tool called guidde which generates demo videos very easily, but very expensive. So I think I can build another tool which can provide 80% function of guidde but only charge 1% of guidde's cost. 

## What it does

**HackDemo** is a Chrome extension + web app that:

- 🎥 **Records your browser workflow** — clicks, inputs, scrolls, and navigation are captured automatically
- 🤖 **Generates AI narration** — DeepSeek writes step-by-step narration for each step
- 🗣️ **Adds voiceover** — Google TTS narrates in 20+ languages
- 📤 **Exports as MP4** — annotated screenshots + audio compiled into a shareable video
- 💰 **Pay-as-you-go** — $0.50 free for new users, then pay only for the AI tokens you use (~$0.03 per demo)

## How we built it

| Layer | Stack |
|---|---|
| **Chrome Extension** | Manifest V3, offscreen documents, `tabCapture`, content scripts |
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS, deployed on Vercel |
| **Backend** | Fastify (Node.js) on Vercel, Aurora DSQL (PostgreSQL) |
| **Worker** | Vercel Serverless, processes demos asynchronously |
| **Auth** | Auth.js v5 with Google OAuth + email/password (Credentials provider) |
| **AI** | DeepSeek for narration, Google Translate TTS for voiceover |
| **Storage** | Cloudflare R2 for video + audio files |
| **Payments** | PayPal via REST API, Resend for email verification |
| **Messaging** | Ably for real-time job dispatch from backend to worker |

## Challenges we ran into

- **Auth.js v5 with multiple domains** — cross-origin OAuth with separate frontend/backend domains required custom `redirect` callbacks, cross-domain cookie config, and CSRF handling for form-based sign-in
- **Aurora DSQL compatibility** — DSQL doesn't support `SERIAL`, `DEFAULT` in `ALTER TABLE`, or foreign key constraints, requiring workarounds at the application layer
- **Google Safe Browsing false positive** — the `.win` TLD + Google OAuth login page triggered a phishing warning; resolved by adding product content to the login page, security.txt, and Search Console appeal
- **Extension-to-web-app auth sync** — passing the API token from the web app to the Chrome extension required a DOM data-attribute bridge (Chrome's isolated worlds block `window.postMessage` race conditions)
- **Billing synchronization** — ensuring AI token charges are reflected in the frontend credits display immediately after processing required session refresh callbacks

## Accomplishments that we're proud of

- **End-to-end in seconds** — from clicking "Start Capture" to watching a narrated demo video takes ~30 seconds
- **20+ language support** — the same narration pipeline handles English, Chinese, Japanese, Korean, and 16+ other languages
- **Full billing pipeline** — sign-up bonus ($0.50), per-token AI billing, PayPal top-up, transaction audit trail, and credit enforcement
- **Chrome Web Store ready** — extension packaged, permissions minimized, manifest complete
- **Framework-agnostic auth** — Auth.js v5 running on Fastify, not Next.js, with cross-domain session support

## What we learned

- Auth.js v5's architecture is truly framework-agnostic but requires deep understanding for non-Next.js setups
- Chrome extension isolated worlds make auth token sharing tricky — DOM attributes are more reliable than `postMessage`
- Aurora DSQL is a high-performance Postgres-compatible database but has subtle compatibility differences
- Cloudflare Email Sending requires Paid Workers, but Resend offers a simpler free-tier alternative
- Google Safe Browsing is aggressive with `.win` domains — registering early and adding `security.txt` helps

## What's next for HackDemo

- [ ] Chrome Web Store publication
- [ ] Manual step editing — edit AI-generated narration, reorder steps, add custom screenshots
- [ ] AI-powered screenshot blurring (auto-detect and blur sensitive info)
- [ ] Team workspaces — share demos with teammates
- [ ] Custom branding — add company logo and colors to demo videos
- [ ] Direct video upload to YouTube / Loom / Google Drive
- [ ] Browser-native recording API (when `navigator.mediaDevices.getDisplayMedia` supports tab audio in more browsers)
- [ ] Self-hosted option for enterprise

---

Built with ❤️ by HackDemo Team | [hackdemo.win](https://hackdemo.win) | [demoagenttest123@gmail.com](mailto:demoagenttest123@gmail.com)
