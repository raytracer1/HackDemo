export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mt-1 text-sm text-gray-500">Last updated: June 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-600">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">1. Information We Collect</h2>
          <p className="mt-2">
            When you sign in, we collect your name, email address, and profile picture.
            When you use the Chrome extension to record a demo, we collect browser interactions
            (clicks, inputs, scrolls, page URLs, page titles) and screenshots of the web pages
            you choose to record. These are necessary to generate the demo video.
            We do <strong>not</strong> record passwords, credit card numbers, or form field values
            marked as sensitive by the browser.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">2. Chrome Extension Permissions</h2>
          <p className="mt-2">
            The HackDemo extension requires certain permissions to function:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li><strong>tabs</strong> — to open the demo result page and communicate with the recording panel.</li>
            <li><strong>storage</strong> — to save your authentication token and recording state locally.</li>
            <li><strong>tabCapture</strong> — to record the browser tab as video while you record a demo.</li>
            <li><strong>offscreen</strong> — to process video in the background without interrupting you.</li>
            <li><strong>Host permission (all URLs)</strong> — the extension needs to work on any website you choose to record. Recording only starts when you explicitly click the extension icon and press Start Capture.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">3. How We Use Your Information</h2>
          <p className="mt-2">
            We use your information to provide the HackDemo service: authenticating your account,
            generating AI-narrated demo videos, and tracking your credit balance. We do not sell
            your personal information to third parties. We do not use your data for advertising.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">4. Data Storage</h2>
          <p className="mt-2">
            Demo recordings, screenshots, and generated videos are stored on Cloudflare R2.
            Account information is stored in a secure database. You can request deletion of your
            data by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">5. Third-Party Services</h2>
          <p className="mt-2">
            We use Google OAuth for authentication, DeepSeek for AI narration generation,
            Google TTS for voiceover, and PayPal for payment processing. Each service has its
            own privacy policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">6. Contact</h2>
          <p className="mt-2">
            If you have questions about this privacy policy, contact us at{' '}
            <a href="mailto:demoagenttest123@gmail.com" className="text-hack-primary hover:underline">demoagenttest123@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
