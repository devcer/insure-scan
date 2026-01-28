"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function InsuranceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const navLinks = [
    { href: "/insurance/dashboard", label: "Dashboard" },
    { href: "/insurance/policies", label: "Policies" },
    { href: "/insurance/emails", label: "Emails" },
    { href: "/insurance/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex-shrink-0">
              <Link href="/insurance/dashboard">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Insurance Scanner
                </span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${pathname === link.href
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === link.href
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div >
      </nav >

      {/* Main Content */}
      < main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" >
        {children}
      </main >
    </div >
  );
}
