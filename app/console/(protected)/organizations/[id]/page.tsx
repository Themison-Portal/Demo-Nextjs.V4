import { OrganizationDetails } from '@/components/console/organizations/OrganizationDetails';

interface OrganizationDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizationDetailsPage({
  params,
}: OrganizationDetailsPageProps) {
  const { id } = await params;
  return <OrganizationDetails id={id} />;
}
