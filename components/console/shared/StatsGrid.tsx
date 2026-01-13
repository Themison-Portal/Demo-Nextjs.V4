/**
 * StatsGrid Component
 * Displays organization statistics grid (shared between Dashboard and Organizations)
 */

import { Building2, CheckCircle, Users } from "lucide-react";
import { StatCard } from "./StatCard";

interface StatsGridProps {
  stats: {
    total: number;
    active: number;
    totalUsers: number;
  };
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total Organizations"
        value={stats.total}
        icon={<Building2 className="h-6 w-6 text-gray-600" />}
        iconBgColor="bg-gray-50"
      />

      <StatCard
        title="Active Organizations"
        value={stats.active}
        icon={<CheckCircle className="h-6 w-6 text-gray-600" />}
        iconBgColor="bg-gray-50"
      />

      <StatCard
        title="Total Users"
        value={stats.totalUsers}
        icon={<Users className="h-6 w-6 text-gray-600" />}
        iconBgColor="bg-gray-50"
      />
    </div>
  );
}
