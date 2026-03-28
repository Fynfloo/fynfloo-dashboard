// app/(dashboard)/dashboard/[storeId]/products/new/page.tsx
import { ProductForm } from '@/features/products/components/ProductForm';

export default function NewProductPage() {
  return <ProductForm mode="create" />;
}
