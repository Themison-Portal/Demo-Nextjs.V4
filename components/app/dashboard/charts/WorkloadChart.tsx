/**
 * Workload Chart Component
 * Displays task distribution by assignee (horizontal bar chart)
 */

"use client";

import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import type { DashboardStats } from "@/services/dashboard/types";

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{label}</p>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-blue-600" />
          <span className="text-muted-foreground">Tasks:</span>
          <span className="font-medium">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

interface WorkloadChartProps {
  stats: DashboardStats["tasks"]["byAssignee"];
}

export function WorkloadChart({ stats }: WorkloadChartProps) {
  // Take top 5 assignees by task count
  const data = stats.slice(0, 5).map((assignee) => ({
    name: assignee.user_name || "Unknown",
    tasks: assignee.count,
  }));

  if (data.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-2">Team Workload</h3>
        <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
          No assigned tasks yet
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-2">Team Workload (Top 5)</h3>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            dataKey="name"
            type="category"
            width={100}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(251, 146, 60, 0.1)" }}
            wrapperStyle={{ outline: "none" }}
          />
          <Bar dataKey="tasks" fill="#2563eb" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground text-center mt-1">
        Tasks assigned per team member
      </p>
    </Card>
  );
}
