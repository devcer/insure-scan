"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">Privacy Policy</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">Last updated: January 26, 2026</p>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your Privacy Matters</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            InsureScan is designed with privacy and security as top priorities. We believe your insurance data belongs to you, and we are committed to protecting it.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">What Data We Access</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li>Read-only access to your Gmail (insurance-related emails only)</li>
            <li>We never send emails or modify your inbox</li>
            <li>We extract only necessary fields: premium amount, due date, policy number, insurer name</li>
            <li>We do <span className="font-bold">not</span> store full email content or attachments</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How We Use Your Data</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li>To display upcoming and paid insurance premiums in your dashboard</li>
            <li>To help you track policy renewals and receipts</li>
            <li>To provide reminders and insights (never marketing)</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your Controls</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li>You can disconnect InsureScan from your Google account at any time</li>
            <li>You can request deletion of all your extracted data</li>
            <li>No data is shared with third parties</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Security</h2>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
            <li>All data is encrypted in transit and at rest</li>
            <li>We follow industry best practices for authentication and storage</li>
            <li>Access is limited to your own account</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Contact</h2>
          <p className="text-gray-700 dark:text-gray-300">
            If you have questions or want your data deleted, email us at
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
