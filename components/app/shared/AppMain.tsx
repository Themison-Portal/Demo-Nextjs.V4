/**
 * App Main Component
 * Main layout wrapper for clinic app with sidebar + header + scrollable content
 */

"use client";

import { AppSidebar } from "./AppSidebar";
import { useOrganization } from "@/hooks/client/useOrganization";
import { useTrialDetails } from "@/hooks/client/useTrialDetails";
import { usePatientDetails } from "@/hooks/client/usePatientDetails";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { organization, isLoading } = useOrganization(orgId);

  // Extract trialId from pathname if in trial route, or from query params if in Document AI
  const trialId = useMemo(() => {
    // Check if in trial route (e.g., /trials/[trialId])
    const match = pathname.match(/\/trials\/([^\/]+)/);
    if (match) return match[1];

    // Check if in Document AI route with trialId query param (e.g., /ai?trialId=...)
    if (pathname.includes("/ai")) {
      return searchParams.get("trialId");
    }

    return null;
  }, [pathname, searchParams]);

  // Extract patientId from pathname if in patient route
  const patientId = useMemo(() => {
    // Check if in patient route (e.g., /trials/[trialId]/patients/[patientId])
    const match = pathname.match(/\/patients\/([^\/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  // Detect if in patients list route
  const isInPatientsRoute = useMemo(() => {
    return pathname.includes("/patients") && trialId;
  }, [pathname, trialId]);

  // Fetch trial details if in trial route
  // Hook already handles enabled: !!trialId internally
  const { trial, isLoading: isLoadingTrial } = useTrialDetails(
    orgId,
    trialId || "",
  );

  // Fetch patient details if in patient route
  const { patient, isLoading: isLoadingPatient } = usePatientDetails(
    orgId,
    trialId || "",
    patientId || "",
  );

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

                {/* Trial breadcrumb if in trial route */}
                {trialId && (
                  <>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    {isLoadingTrial ? (
                      <div className="h-5 w-24 animate-pulse bg-gray-200 rounded" />
                    ) : (
                      <span className="text-gray-700 font-medium">
                        {trial?.name || "Trial"}
                      </span>
                    )}
                  </>
                )}

                {/* Patients breadcrumb if in patients route */}
                {isInPatientsRoute && (
                  <>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <Link
                      href={ROUTES.APP.TRIAL_TAB(orgId, trialId!, "patients")}
                      className="text-gray-700 font-medium hover:text-gray-900 transition-colors"
                    >
                      Patients
                    </Link>
                  </>
                )}

                {/* Patient number if viewing specific patient */}
                {patientId && (
                  <>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    {isLoadingPatient ? (
                      <div className="h-5 w-16 animate-pulse bg-gray-200 rounded" />
                    ) : (
                      <span className="text-gray-700 font-medium">
                        {patient?.patient_number || "Patient"}
                      </span>
                    )}
                  </>
                )}
              </>
            )}
          </nav>
        </header>

        {/* Main - scrollable area con fondo gris */}
        <main className="flex-1 overflow-auto bg-gray-50 p-8">{children}</main>
      </div>
    </div>
  );
}
