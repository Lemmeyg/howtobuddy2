'use client';

import { useEffect } from 'react';
import DashboardError from '@/components/dashboard/error-boundary';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log any errors to an error reporting service
    console.error('Dashboard Page Error:', error);
  }, [error]);

  return <DashboardError error={error} reset={reset} />;
} 