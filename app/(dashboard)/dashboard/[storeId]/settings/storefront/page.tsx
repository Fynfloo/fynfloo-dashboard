import { PageHeader } from '@/components/shared/PageHeader';
import { SettingsNav } from '@/features/settings/components/SettingsNav';
import { StorefrontShellForm } from '@/features/settings/components/StorefrontShellForm';

export default function StorefrontSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsNav />
      <StorefrontShellForm />
    </>
  );
}
