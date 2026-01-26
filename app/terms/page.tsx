"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">Terms & Conditions</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">Last updated: January 26, 2026</p>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">1. Acceptance of Terms</h2>
          <p className="text-gray-700 dark:text-gray-300">By using InsureScan, you agree to these Terms & Conditions. If you do not agree, please do not use the service.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">2. Service Description</h2>
          <p className="text-gray-700 dark:text-gray-300">InsureScan helps you track insurance premiums by scanning your Gmail for insurance-related emails and extracting relevant data. The service is provided on a best-effort basis and may change or discontinue at any time.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">3. User Responsibilities</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li>You must use your own Google account and not impersonate others.</li>
            <li>You are responsible for maintaining the security of your account.</li>
            <li>You must not use the service for unlawful or harmful purposes.</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">4. Acceptable Use</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li>No reverse engineering, scraping, or abuse of the service.</li>
            <li>No sharing of extracted data with unauthorized third parties.</li>
            <li>No attempts to disrupt or overload the service.</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">5. Disclaimers</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li>InsureScan is not affiliated with any insurance provider or Google.</li>
            <li>We do not guarantee the accuracy or completeness of extracted data.</li>
            <li>The service is provided "as is" without warranties of any kind.</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">6. Limitation of Liability</h2>
          <p className="text-gray-700 dark:text-gray-300">InsureScan is not liable for any damages, losses, or missed payments resulting from use of the service. Users are responsible for verifying all information and due dates.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">7. Changes to Terms</h2>
          <p className="text-gray-700 dark:text-gray-300">We may update these Terms & Conditions at any time. Continued use of the service constitutes acceptance of the new terms.</p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">8. Contact</h2>
          <p className="text-gray-700 dark:text-gray-300">
            For questions or concerns, email us at
            <a href="mailto:support@insurescan.in" className="ml-1 underline text-blue-600 dark:text-blue-400">support@insurescan.in</a>.
          </p>
        </section>
        <div className="mt-10">
          <Link href="/" className="text-blue-600 dark:text-blue-400 underline font-medium">← Back to Home</Link>
        </div>
      </main>
      <footer className="w-full py-8 px-4 bg-gray-100 dark:bg-gray-950 text-gray-600 dark:text-gray-400 text-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-4 items-center">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <a href="mailto:support@insurescan.in" className="hover:underline">Contact</a>
        </div>
        <div className="flex items-center gap-2">
          <span>Made in India</span>
          <span className="text-lg">🇮🇳</span>
        </div>
      </footer>
    </div>
  );
}
