/**
 * NavigationTabs Component
 * Reusable tab navigation that syncs with URL
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TabItem {
  label: string;
  value: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavigationTabsProps {
  tabs: TabItem[];
  className?: string;
}

export function NavigationTabs({ tabs, className }: NavigationTabsProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 px-2 py-1.5",
        className
      )}
    >
      <nav className="flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.value}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
