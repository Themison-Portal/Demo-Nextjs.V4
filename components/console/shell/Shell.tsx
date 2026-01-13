/**
 * Console Shell Component
 * Wraps all console pages with sidebar (client component)
 */

"use client";

import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";

export function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - rendered once for all console pages */}
      <Sidebar
        userEmail={user?.email}
        userRole={user?.isStaff ? "Themison Staff" : ""}
        userFirstName={user?.firstName}
      />

      {/* Page content */}
      {children}
    </div>
  );
}
