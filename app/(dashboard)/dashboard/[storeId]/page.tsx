// app/(dashboard)/dashboard/[storeId]/page.tsx
import { PageHeader } from '@/components/shared/PageHeader';

export default function OverviewPage() {
  return (
    <div>
      <PageHeader title="Overview" description="Welcome to your Fynfloo dashboard" />
    </div>
  );
}
