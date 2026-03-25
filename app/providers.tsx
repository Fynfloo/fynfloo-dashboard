// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthInitialiser } from '@/components/shared/AuthInitialiser';

type QueryError = {
  status?: number;
  message?: string;
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error: unknown) => {
              const e = error as QueryError;
              if (e?.status === 401 || e?.status === 403) return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitialiser>{children}</AuthInitialiser>
    </QueryClientProvider>
  );
}
