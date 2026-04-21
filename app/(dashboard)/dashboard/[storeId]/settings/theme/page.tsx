// app/(dashboard)/dashboard/[storeId]/settings/theme/page.tsx
import { SettingsNav } from '@/features/settings/components/SettingsNav';
import { ThemeSettingsForm } from '@/features/settings/components/ThemeSettingsForm';
import { PageHeader } from '@/components/shared/PageHeader';

export default async function ThemeSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsNav />
      <ThemeSettingsForm />
    </>
  );
}
