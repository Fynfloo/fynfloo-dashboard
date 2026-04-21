// app/(dashboard)/dashboard/[storeId]/settings/domain/page.tsx
import { SettingsNav } from '@/features/settings/components/SettingsNav';
import { DomainPanel } from '@/features/settings/components/DomainPanel';
import { PageHeader } from '@/components/shared/PageHeader';

export default function DomainSettingsPage({ params }: { params: { storeId: string } }) {
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsNav storeId={params.storeId} />
      <DomainPanel storeId={params.storeId} />
    </>
  );
}
