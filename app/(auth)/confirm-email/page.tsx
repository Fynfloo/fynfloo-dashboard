import { Suspense } from 'react';
import { ConfirmEmailForm } from '@/features/auth/components/ConfirmEmailForm';

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailForm />
    </Suspense>
  );
}
