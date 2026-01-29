/**
 * Stats Grid Component
 * Grid of stat cards with real data
 */

"use client";

import { StatCard } from "./StatCard";
import { FileText, Users, UserCheck, CheckSquare } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { useDashboardStats } from "@/hooks/client/useDashboardStats";

interface StatsGridProps {
  orgId: string;
}

export function StatsGrid({ orgId }: StatsGridProps) {
  const { data: stats, isLoading } = useDashboardStats(orgId);

  // Show loading state with placeholder values
  if (isLoading || !stats) {
    return (
      <div className="flex w-full gap-4">
        <StatCard
          label="Active Trials"
          value={0}
          icon={<FileText className="h-5 w-5" />}
          href={ROUTES.APP.TRIALS(orgId)}
        />
        <StatCard
          label="Total Patients"
          value={0}
          icon={<Users className="h-5 w-5" />}
          href={ROUTES.APP.TRIALS(orgId)}
        />
        <StatCard
          label="Team members"
          value={0}
          icon={<UserCheck className="h-5 w-5" />}
          href={ROUTES.APP.ORGANIZATION_TAB(orgId, "members")}
        />
        <StatCard
          label="Your Tasks"
          value={0}
          icon={<CheckSquare className="h-5 w-5" />}
          href={ROUTES.APP.TASKS(orgId)}
        />
      </div>
    );
  }

  // Count active trials specifically
  const activeTrials = stats.trials.byStatus.active || 0;

  return (
    <div className="flex w-full gap-4">
      <StatCard
        label="Active Trials"
        value={activeTrials}
        icon={<FileText className="h-5 w-5" />}
        href={ROUTES.APP.TRIALS(orgId)}
      />

      <StatCard
        label="Total Patients"
        value={stats.patients.total}
        icon={<Users className="h-5 w-5" />}
        href={ROUTES.APP.TRIALS(orgId)}
      />

      <StatCard
        label="Team members"
        value={stats.teamMembers.total}
        icon={<UserCheck className="h-5 w-5" />}
        href={ROUTES.APP.ORGANIZATION_TAB(orgId, "members")}
      />

      <StatCard
        label="Your Tasks"
        value={stats.tasks.total}
        icon={<CheckSquare className="h-5 w-5" />}
        href={ROUTES.APP.TASKS(orgId)}
      />
    </div>
  );
}
