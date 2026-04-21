// app/(dashboard)/dashboard/[storeId]/settings/domain/page.tsx
import { SettingsNav } from '@/features/settings/components/SettingsNav';
import { DomainPanel } from '@/features/settings/components/DomainPanel';
import { PageHeader } from '@/components/shared/PageHeader';

export default async function DomainSettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsNav />
      <DomainPanel />
    </>
  );
}
