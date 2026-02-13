'use client';

import { use } from 'react';
import { PolicyDetailsPage } from '@/lib/components';

export default function PolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PolicyDetailsPage policyId={id} />;
}
