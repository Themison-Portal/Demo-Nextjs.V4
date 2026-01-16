/**
 * App Main Component
 * Main layout wrapper for clinic app with sidebar + header + scrollable content
 */

"use client";

import { AppSidebar } from "./AppSidebar";

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
  return (
    <div className="flex h-screen bg-white">
      <AppSidebar
        orgId={orgId}
        userEmail={userEmail}
        userFirstName={userFirstName}
      />

      <div className="flex flex-1 flex-col">
        {/* Header - fixed, no scroll */}
        <header className="h-12 border-b border-gray-200 bg-white">
          {/* Header content (breadcrumbs, actions, etc.) */}
        </header>

        {/* Main - scrollable area con fondo gris */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
