/**
 * Premium Landing Page Component
 * Award-worthy landing page with advanced visual effects
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import {
  PremiumCard,
  PremiumButton,
  BackgroundEffects,
  ParallaxContainer,
  LightingEffects,
  AnimatedProgressRing,
  AnimatedBarChart,
  CelebrationAnimation,
  SuccessAnimation,
} from './index';

export function PremiumLandingPage() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const trustMetrics = [
    { label: 'Security', value: 98, color: '#10b981' },
    { label: 'Accuracy', value: 95, color: '#3b82f6' },
    { label: 'Speed', value: 92, color: '#f59e0b' },
    { label: 'Reliability', value: 97, color: '#8b5cf6' },
  ];

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowCelebration(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundEffects variant="gradient" particleCount={30} />

      <div className="relative z-10">
        {/* Premium Header */}
        <header className="w-full px-6 py-4 flex items-center justify-between glass backdrop-blur-xl sticky top-0 z-30 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <LightingEffects intensity="medium">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-premium animate-float">
                <span className="text-white font-bold text-xl">I</span>
              </div>
            </LightingEffects>
            <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              InsureScan
            </span>
          </div>

          <nav className="hidden md:flex gap-8 text-gray-600 dark:text-gray-300 text-sm font-medium">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105">Features</a>
            <a href="#how" className="hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105">How it Works</a>
            <a href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105">Privacy</a>
          </nav>

          <PremiumButton variant="primary" glow className="animate-pulse-glow bg-blue-600 hover:bg-blue-700 text-white" onClick={handleGoogleSignIn}>
            Get Started
          </PremiumButton>
        </header>

        {/* Hero Section */}
        <HeroSection onGetStarted={handleGoogleSignIn} />

        {/* Trust Section */}
        <TrustSection metrics={trustMetrics} />

        {/* How It Works */}
        <HowItWorksSection />

        {/* Features */}
        <FeaturesSection />

        {/* CTA */}
        <CTASection onGetStarted={handleGoogleSignIn} />

        {/* Footer */}
        <Footer />
      </div>

      <CelebrationAnimation
        trigger={showCelebration}
        type="sparkles"
        intensity="medium"
        colors={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']}
        onComplete={() => setShowCelebration(false)}
      />

      <SuccessAnimation
        show={showSuccess}
        message="Welcome to the future of insurance management!"
        onComplete={() => setShowSuccess(false)}
      />
    </div>
  );
}

function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="flex flex-col items-center justify-center text-center py-32 px-4 relative">
      <ParallaxContainer speed={0.2}>
        <div className="relative z-10 max-w-6xl mx-auto">
          <LightingEffects intensity="subtle">
            <div className="inline-flex items-center gap-2 glass-premium text-primary-700 dark:text-primary-300 px-6 py-3 rounded-full text-sm font-medium mb-8 border border-glass-border-strong animate-bounce-in">
              <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse-glow"></div>
              Now supporting 130+ Indian insurers
            </div>
          </LightingEffects>

          <h1 className="text-6xl md:text-8xl font-extrabold text-gray-900 dark:text-white mb-8 leading-tight animate-fade-in">
            Never miss an
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent font-extrabold">
              insurance premium
            </span>
            <br />
            again.
          </h1>

          <p className="text-2xl md:text-3xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed animate-slide-in-up">
            Connect your Gmail and instantly track premium due dates, receipts, and policy renewals.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 mb-12 justify-center animate-slide-in-up">
            <PremiumButton variant="primary" size="xl" glow className="shadow-glow-strong bg-blue-600 hover:bg-blue-700 text-white" onClick={onGetStarted}>
              Continue with Google
            </PremiumButton>
            <PremiumButton variant="glass" size="xl" className="backdrop-blur-xl">
              Watch Demo
            </PremiumButton>
          </div>
        </div>
      </ParallaxContainer>
    </section>
  );
}

function TrustSection({ metrics }: { metrics: any[] }) {
  return (
    <section className="py-16 px-4 relative">
      <ParallaxContainer speed={0.1}>
        <div className="max-w-6xl mx-auto">
          <PremiumCard variant="glass" className="p-12 backdrop-blur-xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Trusted by Thousands</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">Built with security and privacy at its core</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              {[
                { icon: "🔒", title: "Read-only Gmail", desc: "Secure OAuth access" },
                { icon: "🗂️", title: "No email storage", desc: "Only extracted data" },
                { icon: "🔌", title: "Disconnect anytime", desc: "Full control" },
                { icon: "🇮🇳", title: "Built for India", desc: "130+ insurers" }
              ].map((item, index) => (
                <LightingEffects key={index} intensity="medium">
                  <div className="flex flex-col items-center text-center p-6 rounded-2xl glass hover-scale animate-slide-in-up">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-premium animate-float">
                      <span className="text-3xl">{item.icon}</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{item.title}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</span>
                  </div>
                </LightingEffects>
              ))}
            </div>

            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-center mb-6 text-gray-900 dark:text-white">Our Performance Metrics</h3>
              <AnimatedBarChart data={metrics} height={150} showValues />
            </div>
          </PremiumCard>
        </div>
      </ParallaxContainer>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how" className="py-24 px-4 relative">
      <ParallaxContainer speed={0.15}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 animate-fade-in">How it Works</h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 animate-slide-in-up">Get started in under 2 minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-20 left-1/3 right-1/3 h-1 bg-gradient-to-r from-blue-200 via-blue-500 to-blue-200 dark:from-blue-800 dark:via-blue-600 dark:to-blue-800 rounded-full animate-gradient-shift"></div>

            {[
              { step: 1, title: "Connect Gmail", desc: "Secure OAuth login with Google. We only request read-only access.", time: "30 seconds", color: "from-blue-500 to-blue-600" },
              { step: 2, title: "Scan Insurance Emails", desc: "Our AI scans your inbox for insurance emails automatically.", time: "1 minute", color: "from-purple-500 to-purple-600" },
              { step: 3, title: "View Dashboard", desc: "See all your policies, due dates, and payment history.", time: "Instant", color: "from-indigo-500 to-indigo-600" }
            ].map((item, index) => (
              <div key={index} className="relative animate-slide-in-up" style={{ animationDelay: `${index * 200}ms` }}>
                <LightingEffects intensity="strong">
                  <PremiumCard variant="elevated" className="p-10 text-center relative z-10 hover-scale">
                    <div className={`w-20 h-20 bg-gradient-to-br ${item.color} text-white rounded-3xl flex items-center justify-center text-3xl font-bold mb-8 mx-auto shadow-premium animate-bounce-in`}>
                      {item.step}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{item.desc}</p>
                    <div className="inline-flex items-center gap-2 glass-premium px-4 py-2 rounded-full text-sm font-medium">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      {item.time}
                    </div>
                  </PremiumCard>
                </LightingEffects>
              </div>
            ))}
          </div>
        </div>
      </ParallaxContainer>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 relative">
      <ParallaxContainer speed={0.1}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 animate-fade-in">Premium Features</h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 animate-slide-in-up">Everything you need to manage your insurance policies</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Smart Dashboard", desc: "See all upcoming due dates and payment history in one place.", icon: "📊", gradient: "from-blue-500 to-blue-600" },
              { title: "Multi-Policy Tracking", desc: "Track multiple policies for you and your family members.", icon: "👨‍👩‍👧‍👦", gradient: "from-green-500 to-green-600" },
              { title: "Payment History", desc: "View all receipts and payment confirmations automatically.", icon: "🧾", gradient: "from-purple-500 to-purple-600" },
              { title: "Smart Classification", desc: "Automatic classification of emails with high accuracy.", icon: "🎯", gradient: "from-amber-500 to-amber-600" },
              { title: "Advanced Search", desc: "Find policies quickly by name, date, or policy number.", icon: "🔍", gradient: "from-cyan-500 to-cyan-600" },
              { title: "Privacy First", desc: "No raw emails stored. Bank-level security.", icon: "🛡️", gradient: "from-red-500 to-red-600" }
            ].map((feature, index) => (
              <div key={index} className="animate-slide-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <LightingEffects intensity="medium">
                  <PremiumCard variant="glass" className="p-8 hover-scale hover-glow backdrop-blur-xl h-full">
                    <div className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-premium animate-float`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                  </PremiumCard>
                </LightingEffects>
              </div>
            ))}
          </div>
        </div>
      </ParallaxContainer>
    </section>
  );
}

function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="py-24 px-4 relative">
      <ParallaxContainer speed={0.2}>
        <div className="max-w-4xl mx-auto text-center">
          <LightingEffects intensity="strong">
            <div className="p-16 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 animate-gradient-shift">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white animate-bounce-in">
                Ready to never miss a premium again?
              </h2>
              <p className="text-2xl mb-12 text-white/90 animate-slide-in-up">
                Join thousands of users who trust InsureScan
              </p>

              <div className="flex justify-center mb-8">
                <AnimatedProgressRing progress={98} size={120} color="#ffffff" backgroundColor="rgba(255,255,255,0.2)" />
              </div>

              <PremiumButton variant="secondary" size="xl" glow className="bg-white text-blue-700 font-bold shadow-premium hover:shadow-glow-strong animate-pulse-glow" onClick={onGetStarted}>
                Get Started Free
              </PremiumButton>
            </div>
          </LightingEffects>
        </div>
      </ParallaxContainer>
    </section>
  );
}

function Footer() {
  return (
    <footer className="w-full py-16 px-4 glass-strong backdrop-blur-xl border-t border-glass-border-strong">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <LightingEffects intensity="medium">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-premium">
                  <span className="text-white font-bold text-lg">I</span>
                </div>
              </LightingEffects>
              <span className="font-bold text-xl text-gray-900 dark:text-white">InsureScan</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Never miss an insurance premium again. Built for India.</p>
          </div>

          {[
            { title: "Product", links: [{ text: "Features", href: "#features" }, { text: "How it Works", href: "#how" }] },
            { title: "Company", links: [{ text: "Privacy Policy", href: "/privacy" }, { text: "Terms", href: "/terms" }] },
            { title: "Support", links: [{ text: "FAQ", href: "#faq" }, { text: "Contact", href: "mailto:support@insurescan.in" }] }
          ].map((section, index) => (
            <div key={index} className="animate-slide-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link href={link.href} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-105 inline-block">
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-glass-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="text-gray-600 dark:text-gray-400 text-lg">© 2026 InsureScan. All rights reserved.</div>
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-lg">
            <span>Made with ❤️ in India</span>
            <span className="text-2xl animate-float">🇮🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
