// app/(dashboard)/dashboard/[storeId]/settings/security/page.tsx
import { SettingsNav } from '@/features/settings/components/SettingsNav';
import { SecurityPanel } from '@/features/settings/components/SecurityPanel';
import { PageHeader } from '@/components/shared/PageHeader';

export default function SecuritySettingsPage({ params }: { params: { storeId: string } }) {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsNav storeId={params.storeId} />
      <SecurityPanel />
    </>
  );
}
