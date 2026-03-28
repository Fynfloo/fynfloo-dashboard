// app/(dashboard)/dashboard/[storeId]/products/new/page.tsx
// The full create form page is not used.
// Product creation happens via the QuickCreateModal on the list page.
// This redirect handles any direct navigation to /products/new.

import { redirect } from 'next/navigation';

export default function NewProductPage({ params }: { params: { storeId: string } }) {
  redirect(`/dashboard/${params.storeId}/products`);
}
