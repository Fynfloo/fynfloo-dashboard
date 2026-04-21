// app/(dashboard)/dashboard/[storeId]/settings/payments/page.tsx
import { SettingsNav } from '@/features/settings/components/SettingsNav';
import { StripeConnectPanel } from '@/features/settings/components/StripeConnectPanel';
import { PageHeader } from '@/components/shared/PageHeader';

export default function PaymentsSettingsPage({ params }: { params: { storeId: string } }) {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsNav storeId={params.storeId} />
      <StripeConnectPanel storeId={params.storeId} />
    </>
  );
}
