/**
 * Stats Grid Component
 * Grid of stat cards with mockup data
 */

import { StatCard } from "./StatCard";
import { FileText, Users, UserCheck, CheckSquare } from "lucide-react";
import { ROUTES } from "@/lib/routes";

interface StatsGridProps {
  orgId: string;
}

export function StatsGrid({ orgId }: StatsGridProps) {
  return (
    <div className="flex w-full gap-4">
      <StatCard
        label="Active Trials"
        value={12}
        icon={<FileText className="h-5 w-5" />}
        href={ROUTES.APP.TRIALS(orgId)}
      />

      <StatCard
        label="Total Patients"
        value={37}
        icon={<Users className="h-5 w-5" />}
        href={ROUTES.APP.TRIALS(orgId)}
      />

      <StatCard
        label="Team members"
        value={8}
        icon={<UserCheck className="h-5 w-5" />}
        href={ROUTES.APP.ORGANIZATION_TAB(orgId, "members")}
      />

      <StatCard
        label="Your Tasks"
        value={21}
        icon={<CheckSquare className="h-5 w-5" />}
        href={ROUTES.APP.TASKS(orgId)}
      />
    </div>
  );
}
