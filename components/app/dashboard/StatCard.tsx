/**
 * Stat Card Component
 * Reusable card for displaying statistics
 */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  href?: string;
}

export function StatCard({ label, value, icon, href }: StatCardProps) {
  const content = (
    <CardContent className="flex items-center gap-4">
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm font-light text-gray-900">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full">
        <Card
          size="default"
          className="w-auto flex-1 rounded-md hover:shadow-md transition-shadow cursor-pointer"
        >
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card size="default" className="w-auto flex-1 rounded-md">
      {content}
    </Card>
  );
}
