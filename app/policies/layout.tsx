"use client";

import { PremiumLayout } from "../../lib/components/PremiumLayout";

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PremiumLayout
      showBreadcrumb={true}
      breadcrumbPathMap={{
        '/dashboard': 'Dashboard',
        '/policies': 'Policies',
        '/emails': 'Emails',
        '/settings': 'Settings',
      }}
    >
      {children}
    </PremiumLayout>
  );
}
