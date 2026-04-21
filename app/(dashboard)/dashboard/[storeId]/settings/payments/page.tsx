// app/(dashboard)/dashboard/[storeId]/settings/payments/page.tsx
import { SettingsNav } from '@/features/settings/components/SettingsNav';
import { StripeConnectPanel } from '@/features/settings/components/StripeConnectPanel';
import { PageHeader } from '@/components/shared/PageHeader';

export default async function PaymentsSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsNav />
      <StripeConnectPanel />
    </>
  );
}
