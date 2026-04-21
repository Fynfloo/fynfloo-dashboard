// app/(dashboard)/dashboard/[storeId]/settings/page.tsx
import { SettingsNav } from '@/features/settings/components/SettingsNav';
import { GeneralSettingsForm } from '@/features/settings/components/GeneralSettingsForm';
import { PageHeader } from '@/components/shared/PageHeader';

export default function SettingsPage({ params }: { params: { storeId: string } }) {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsNav storeId={params.storeId} />
      <GeneralSettingsForm storeId={params.storeId} />
    </>
  );
}
