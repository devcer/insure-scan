"use client";

import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">Contact Us</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">We'd love to hear from you! For support, feedback, or partnership inquiries, please use the information below.</p>
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Support</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            For help with your account, technical issues, or data deletion requests, email us at:
          </p>
          <a href="mailto:support@insurescan.in" className="underline text-blue-600 dark:text-blue-400 font-medium">support@insurescan.in</a>
        </section>
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Feedback & Suggestions</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            We welcome your ideas to improve InsureScan. Share your feedback at:
          </p>
          <a href="mailto:feedback@insurescan.in" className="underline text-blue-600 dark:text-blue-400 font-medium">feedback@insurescan.in</a>
        </section>
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Partnerships & Media</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            For business, press, or partnership opportunities, contact:
          </p>
          <a href="mailto:hello@insurescan.in" className="underline text-blue-600 dark:text-blue-400 font-medium">hello@insurescan.in</a>
        </section>
        <div className="mt-10">
          <Link href="/" className="text-blue-600 dark:text-blue-400 underline font-medium">← Back to Home</Link>
        </div>
      </main>
      <footer className="w-full py-8 px-4 bg-gray-100 dark:bg-gray-950 text-gray-600 dark:text-gray-400 text-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-4 items-center">
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
        </div>
        <div className="flex items-center gap-2">
          <span>Made in India</span>
          <span className="text-lg">🇮🇳</span>
        </div>
      </footer>
    </div>
  );
}
