// app/(dashboard)/dashboard/[storeId]/products/[id]/page.tsx
import { ProductForm } from '@/features/products/components/ProductForm';

export default function EditProductPage() {
  return <ProductForm mode="edit" />;
}
