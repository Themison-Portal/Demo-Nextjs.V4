/**
 * App Main Component
 * Main layout wrapper for clinic app with sidebar + header + scrollable content
 */

"use client";

import { AppSidebar } from "./AppSidebar";
import { useOrganization } from "@/hooks/client/useOrganization";
import { ChevronRight } from "lucide-react";

interface AppMainProps {
  orgId: string;
  children: React.ReactNode;
  userEmail?: string;
  userFirstName?: string;
}

export function AppMain({
  orgId,
  children,
  userEmail,
  userFirstName,
}: AppMainProps) {
  const { organization, isLoading } = useOrganization(orgId);

  return (
    <div className="flex h-screen bg-white">
      <AppSidebar
        orgId={orgId}
        userEmail={userEmail}
        userFirstName={userFirstName}
      />

      <div className="flex flex-1 flex-col">
        {/* Header - fixed, no scroll */}
        <header className="h-12 border-b border-gray-200 bg-white flex items-center px-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm">
            {isLoading ? (
              <div className="h-5 w-32 animate-pulse bg-gray-200 rounded" />
            ) : (
              <>
                {/* Organization Badge */}
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-[10px] font-semibold text-white">
                    {organization?.name?.[0]?.toUpperCase() || "O"}
                  </div>
                  <span className="font-medium text-gray-900">
                    {organization?.name || "Organización"}
                  </span>
                </div>

                {/* Separator for future breadcrumb items */}
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </>
            )}
          </nav>
        </header>

        {/* Main - scrollable area con fondo gris */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
