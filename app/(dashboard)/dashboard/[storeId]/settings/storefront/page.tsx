import { redirect } from 'next/navigation';

type StorefrontSettingsPageProps = {
  params: Promise<{ storeId: string }>;
};

export default async function StorefrontSettingsPage({
  params,
}: StorefrontSettingsPageProps) {
  const { storeId } = await params;
  redirect(`/dashboard/${storeId}/site`);
}
