/**
 * NavigationTabs Component
 * Reusable tab navigation that syncs with URL
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export interface TabItem {
  label: string;
  value: string;
  href: string;
  icon?: React.ReactNode;
}

interface BackLinkProps {
  label: string;
  href: string;
}

interface NavigationTabsProps {
  tabs: TabItem[];
  backLink?: BackLinkProps;
  className?: string;
}

export function NavigationTabs({
  tabs,
  backLink,
  className,
}: NavigationTabsProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 px-2 py-1.5 sticky -top-8 sticky:shadow-md z-10",
        className,
      )}
    >
      <nav className="flex items-center gap-1">
        {/* Back link */}
        {backLink && (
          <>
            <Link
              href={backLink.href}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLink.label}
            </Link>
            <div className="w-px h-5 bg-gray-200 mx-1" />
          </>
        )}

        {/* Tabs */}
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.value}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-gray-100 text-blue-700"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
              )}
            >
              {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
              <p>{tab.label}</p>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
