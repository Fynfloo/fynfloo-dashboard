// app/(dashboard)/dashboard/[storeId]/settings/theme/page.tsx
import { SettingsNav } from '@/features/settings/components/SettingsNav';
import { ThemeSettingsForm } from '@/features/settings/components/ThemeSettingsForm';
import { PageHeader } from '@/components/shared/PageHeader';

export default function ThemeSettingsPage({ params }: { params: { storeId: string } }) {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsNav storeId={params.storeId} />
      <ThemeSettingsForm storeId={params.storeId} />
    </>
  );
}
