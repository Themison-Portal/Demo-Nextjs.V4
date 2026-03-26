import { DashboardClient } from "@/components/app/dashboard/DashboardClient";

interface DashboardPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { orgId } = await params;
  return <DashboardClient orgId={orgId} />;
}
