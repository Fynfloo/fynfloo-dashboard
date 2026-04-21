// app/(dashboard)/dashboard/[storeId]/settings/security/page.tsx
import { SettingsNav } from '@/features/settings/components/SettingsNav';
import { SecurityPanel } from '@/features/settings/components/SecurityPanel';
import { PageHeader } from '@/components/shared/PageHeader';

export default async function SecuritySettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsNav />
      <SecurityPanel />
    </>
  );
}
