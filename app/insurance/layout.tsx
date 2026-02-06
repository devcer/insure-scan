"use client";

import { PremiumLayout } from "../../lib/components/PremiumLayout";

export default function InsuranceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PremiumLayout
      showBreadcrumb={true}
      breadcrumbPathMap={{
        '/insurance': 'Insurance',
        '/insurance/dashboard': 'Dashboard',
        '/insurance/policies': 'Policies',
        '/insurance/emails': 'Emails',
        '/insurance/settings': 'Settings',
      }}
    >
      {children}
    </PremiumLayout>
  );
}
