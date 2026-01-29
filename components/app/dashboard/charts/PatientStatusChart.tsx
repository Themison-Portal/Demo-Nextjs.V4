/**
 * Patient Status Chart Component
 * Displays patient distribution by status
 */

"use client";

import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, TooltipProps } from "recharts";
import type { DashboardStats } from "@/services/dashboard/types";

// Custom tooltip component
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.payload.color }}
          />
          <span className="font-medium text-sm">{entry.name}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Count: <span className="font-medium text-foreground">{entry.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

interface PatientStatusChartProps {
  stats: DashboardStats["patients"];
}

const STATUS_COLORS: Record<string, string> = {
  screening: "#93c5fd", // blue-300
  enrolled: "#2563eb", // blue-600
  completed: "#60a5fa", // blue-400
  withdrawn: "#ef4444", // red-500
  screen_failed: "#ef4444", // red-500
};

const STATUS_LABELS: Record<string, string> = {
  screening: "Screening",
  enrolled: "Enrolled",
  completed: "Completed",
  withdrawn: "Withdrawn",
  screen_failed: "Screen Failed",
};

export function PatientStatusChart({ stats }: PatientStatusChartProps) {
  // Transform data for recharts
  const data = Object.entries(stats.byStatus)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || "#6b7280",
    }));

  if (data.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-2">Patient Status</h3>
        <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
          No patients yet
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-2">Patient Status</h3>
      <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={55}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip />}
            wrapperStyle={{ outline: "none" }}
          />
          <Legend
            verticalAlign="bottom"
            height={28}
            formatter={(value, entry: any) => (
              <span className="text-xs text-foreground">
                {value} ({entry.payload.value})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-1">
        <p className="text-xl font-bold">{stats.total}</p>
        <p className="text-xs text-muted-foreground">Total Patients</p>
      </div>
    </Card>
  );
}
