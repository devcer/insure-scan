"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function Home() {
  // Handles all Google sign-in CTAs
  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/insurance/dashboard" });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
      {/* Header / Navbar */}
      <header className="w-full px-6 py-4 flex items-center justify-between bg-white/80 dark:bg-gray-950/80 shadow-sm sticky top-0 z-30 backdrop-blur">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="InsureScan Logo" width={36} height={36} className="rounded" />
          <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">InsureScan</span>
        </div>
        <nav className="hidden md:flex gap-8 text-gray-700 dark:text-gray-200 text-sm font-medium">
          <a href="#features" className="hover:text-blue-600">Features</a>
          <a href="#how" className="hover:text-blue-600">How it Works</a>
          <a href="#privacy" className="hover:text-blue-600">Privacy</a>
          <a href="#faq" className="hover:text-blue-600">FAQ</a>
        </nav>
        <div className="flex gap-2">
          <button onClick={handleGoogleSignIn} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition">Continue with Google</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-4 bg-gradient-to-b from-white to-blue-50 dark:from-gray-950 dark:to-gray-900">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">Never miss an insurance premium again.</h1>
        <p className="text-lg md:text-2xl text-gray-700 dark:text-gray-200 mb-8 max-w-2xl">Connect Gmail and instantly track premium due dates, receipts, and policy renewals—like CRED, but for insurance.</p>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <button onClick={handleGoogleSignIn} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow transition">Continue with Google</button>
          <a href="#demo" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 px-6 py-3 rounded-lg font-semibold text-lg shadow hover:bg-gray-100 dark:hover:bg-gray-900 transition">See demo</a>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-2">
          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><span className="text-lg">🔒</span> Read-only access</span>
          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><span className="text-lg">🧾</span> Extracts premium amount + due date</span>
          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><span className="text-lg">⚡</span> Scan in seconds</span>
        </div>
      </section>

      {/* Trust Row */}
      <section className="flex flex-wrap justify-center gap-6 py-6 px-4 bg-white dark:bg-gray-950 border-y border-gray-100 dark:border-gray-800" id="trust">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><span className="text-xl">🔒</span> Read-only Gmail access</div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><span className="text-xl">🗂️</span> We don’t store full emails</div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><span className="text-xl">🔌</span> Disconnect anytime</div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200"><span className="text-xl">🇮🇳</span> Built for Indian insurers</div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950" id="how">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">How it Works</h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-10 max-w-4xl mx-auto">
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full w-16 h-16 flex items-center justify-center text-3xl mb-3">1</div>
            <span className="font-semibold text-gray-800 dark:text-gray-100">Login with Google</span>
          </div>
          <div className="h-10 w-1 bg-blue-200 dark:bg-blue-800 md:h-1 md:w-10 md:rotate-0 rotate-90" />
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full w-16 h-16 flex items-center justify-center text-3xl mb-3">2</div>
            <span className="font-semibold text-gray-800 dark:text-gray-100">Click Scan Now</span>
          </div>
          <div className="h-10 w-1 bg-blue-200 dark:bg-blue-800 md:h-1 md:w-10 md:rotate-0 rotate-90" />
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full w-16 h-16 flex items-center justify-center text-3xl mb-3">3</div>
            <span className="font-semibold text-gray-800 dark:text-gray-100">View Dashboard</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">(Upcoming + Paid)</span>
          </div>
        </div>
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">Only insurance-related emails are scanned using filters.</p>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white dark:bg-gray-950" id="features">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard title="Upcoming Premiums Dashboard" desc="See all upcoming due dates in one place." icon="📅" />
          <FeatureCard title="Policy-wise Tracking" desc="Track multiple policies for you and your family." icon="📑" />
          <FeatureCard title="Paid History" desc="View receipts and payment confirmations." icon="🧾" />
          <FeatureCard title="Due / Paid / Unknown" desc="Automatic classification of email status." icon="🔍" />
          <FeatureCard title="Search & Filters" desc="Find policies by name, date, or insurer." icon="🔎" />
          <FeatureCard title="Privacy-first Storage" desc="No raw emails stored, only extracted fields." icon="🛡️" />
        </div>
      </section>

      {/* Product Preview / Screenshots */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950" id="demo">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">Product Preview</h2>
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center max-w-5xl mx-auto">
          <PreviewCard title="Dashboard" imgSrc="/demo-dashboard.png" />
          <PreviewCard title="Premium List" imgSrc="/demo-premiums.png" />
          <PreviewCard title="Settings" imgSrc="/demo-settings.png" />
        </div>
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">CRED-style card UI for a modern experience.</p>
      </section>

      {/* Why Us: Pain vs Solution */}
      <section className="py-20 px-4 bg-white dark:bg-gray-950" id="why">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">Why this beats reminders/manual tracking</h2>
        <div className="flex flex-col md:flex-row gap-10 max-w-5xl mx-auto">
          <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-100">The Pain</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Missed due dates</li>
              <li>Late fees / policy lapses</li>
              <li>Hard to track family policies</li>
              <li>Emails scattered across inbox</li>
            </ul>
          </div>
          <div className="flex-1 bg-blue-50 dark:bg-blue-900 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 text-blue-700 dark:text-blue-200">Our Solution</h3>
            <ul className="list-disc pl-5 space-y-2 text-blue-800 dark:text-blue-100">
              <li>Automatic detection from Gmail</li>
              <li>Central dashboard</li>
              <li>Due date sorting</li>
              <li>Multi-policy support</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950" id="privacy">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">Privacy & Security</h2>
        <div className="max-w-2xl mx-auto flex flex-col gap-4 text-lg text-gray-700 dark:text-gray-200">
          <div className="flex items-center gap-2"><span className="text-xl">🔒</span> Gmail read-only access</div>
          <div className="flex items-center gap-2"><span className="text-xl">🚫</span> We don’t send emails on your behalf</div>
          <div className="flex items-center gap-2"><span className="text-xl">🛡️</span> We store only extracted fields (amount/due date/policy no)</div>
          <div className="flex items-center gap-2"><span className="text-xl">🔌</span> You can disconnect anytime</div>
        </div>
        <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
          <Link href="/privacy" className="underline hover:text-blue-600">Read our full privacy policy</Link>
        </p>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-950" id="faq">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <FAQ q="Is it safe to connect Gmail?" a="Yes. We use Google’s secure OAuth and only request read-only access to your insurance emails." />
          <FAQ q="Do you store my emails?" a="No. We only store extracted fields like premium amount, due date, and policy number." />
          <FAQ q="Which insurers are supported?" a="Most major Indian insurers. If you don’t see yours, let us know!" />
          <FAQ q="Can I track multiple policies?" a="Yes, you can track all policies linked to your Gmail." />
          <FAQ q="Does it scan bank emails too?" a="No, only insurance-related emails are scanned using filters." />
          <FAQ q="Can I disconnect anytime?" a="Absolutely. You can revoke access from your dashboard or Google account settings." />
          <FAQ q="What if it misses a premium email?" a="You can rescan anytime, and we’re constantly improving our detection." />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-4 bg-blue-600 dark:bg-blue-800 text-white text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Track all premiums in one dashboard.</h2>
        <button onClick={handleGoogleSignIn} className="inline-block bg-white text-blue-700 font-semibold px-8 py-3 rounded-lg shadow hover:bg-gray-100 transition text-lg">Continue with Google</button>
      </section>

      {/* Footer */}
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

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 shadow flex flex-col items-start gap-2 border border-gray-100 dark:border-gray-800">
      <span className="text-3xl mb-2">{icon}</span>
      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm">{desc}</p>
    </div>
  );
}

function PreviewCard({ title, imgSrc }: { title: string; imgSrc: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 w-64 h-40 flex items-center justify-center border border-gray-100 dark:border-gray-800">
        <Image src={imgSrc} alt={title + ' preview'} width={220} height={120} className="rounded" />
      </div>
      <span className="font-medium text-gray-800 dark:text-gray-200 mt-2">{title}</span>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border border-gray-100 dark:border-gray-800">
      <div className="font-semibold text-gray-900 dark:text-white mb-1">{q}</div>
      <div className="text-gray-700 dark:text-gray-300 text-sm">{a}</div>
    </div>
  );
}
