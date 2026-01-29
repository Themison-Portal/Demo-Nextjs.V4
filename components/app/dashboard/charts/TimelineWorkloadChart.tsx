/**
 * Timeline Workload Chart Component
 * Displays upcoming workload distribution (visits + tasks) over next 12 weeks
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
  Legend,
  TooltipProps,
} from "recharts";
import type { DashboardStats } from "@/services/dashboard/types";

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
        <div className="border-t border-border mt-2 pt-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-muted-foreground">Total:</span>
            <span>{total}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface TimelineWorkloadChartProps {
  timeline: DashboardStats["timeline"];
}

export function TimelineWorkloadChart({ timeline }: TimelineWorkloadChartProps) {
  if (!timeline || timeline.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-2">Upcoming Workload</h3>
        <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
          No upcoming activities
        </div>
      </Card>
    );
  }

  // Calculate total workload per week
  const data = timeline.map((item) => ({
    week: item.week,
    Visits: item.visits,
    Tasks: item.tasks,
  }));

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-2">Upcoming Workload (12 Weeks)</h3>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(251, 146, 60, 0.1)" }}
            wrapperStyle={{ outline: "none" }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            iconType="rect"
            iconSize={10}
          />
          <Bar dataKey="Visits" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Tasks" stackId="a" fill="#60a5fa" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground text-center mt-1">
        Scheduled visits and pending tasks per week
      </p>
    </Card>
  );
}
