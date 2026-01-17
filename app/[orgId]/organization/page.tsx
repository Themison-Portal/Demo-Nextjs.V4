/**
 * Organization Page - Redirect to Overview
 */

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

interface OrganizationPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { orgId } = await params;
  redirect(ROUTES.APP.ORGANIZATION_TAB(orgId, "overview"));
}
