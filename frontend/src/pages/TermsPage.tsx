export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
      <p className="mt-1 text-sm text-gray-500">Last updated: June 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-300">
        <section>
          <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing or using HackDemo, you agree to be bound by these Terms of Service.
            If you do not agree, do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">2. Account</h2>
          <p className="mt-2">
            You are responsible for maintaining the security of your account. You must notify us
            immediately of any unauthorized use. New accounts receive $0.50 in free credits.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">3. Credits & Payment</h2>
          <p className="mt-2">
            AI narration is charged per token at the rate displayed on our Pricing page.
            Credits are non-refundable. We reserve the right to change pricing with notice.
            Payments are processed securely via PayPal.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">4. Acceptable Use</h2>
          <p className="mt-2">
            You may not use HackDemo to record illegal activities, distribute malware, or violate
            the terms of any website you record. You are solely responsible for the content you
            create.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">5. Limitation of Liability</h2>
          <p className="mt-2">
            HackDemo is provided "as is" without warranties of any kind. We are not liable for
            any damages arising from the use of our service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white">6. Contact</h2>
          <p className="mt-2">
            <a href="mailto:demoagenttest123@gmail.com" className="text-hack-primary hover:underline">demoagenttest123@gmail.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}
