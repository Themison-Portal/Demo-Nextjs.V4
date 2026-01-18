/**
 * Trial Card Component
 * Card that links to trial detail page
 */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";

interface TrialCardProps {
  id: string;
  orgId: string;
  name: string;
  phase: string;
  location: string;
  role?: string;
  principalInvestigator?: string;
  protocolNumber: string;
}

export function TrialCard({
  id,
  orgId,
  name,
  phase,
  location,
  role,
  principalInvestigator,
  protocolNumber,
}: TrialCardProps) {
  return (
    <Link href={ROUTES.APP.TRIAL(orgId, id)}>
      <Card
        size="default"
        className="transition-all hover:shadow-md cursor-pointer bg-white p-0 px-0 "
      >
        <CardContent className="space-y-3 p-0">
          <div className="flex items-center justify-between bg-blue-600 px-6 py-8">
            <div className="space-y-1 flex flex-col">
              <h3 className="text-base font-semibold text-gray-100">{name}</h3>
              <small className="text-white">{protocolNumber}</small>
            </div>
            <ChevronRight className=" h-4 w-4 text-gray-100 font-light" />
          </div>
          <div className="space-y-4 px-6 py-4">
            {/* Phase and Location */}
            <div className="flex items-center gap-2 ">
              <span className="rounded-md border border-blue-500 px-2 py-1 text-xs font-medium text-blue-600">
                {phase}
              </span>
              <span className="text-sm text-gray-900 font-light">
                {location}
              </span>
            </div>

            {/* PI */}
            {principalInvestigator && (
              <p className="text-sm text-gray-900 font-medium">
                PI: <span className="font-light">{principalInvestigator}</span>
              </p>
            )}
            {/* Role */}
            {role && (
              <p className="text-xs text-gray-900 font-medium">
                Your role: <span className="font-light">{role}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
