/**
 * Dashboard View Component
 * Main dashboard view for clinic users with analytics charts
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, UserPlus } from "lucide-react";
import { MyWorkload } from "@/components/app/tasks/MyWorkload";
import { TimelineWorkloadChart } from "./charts/TimelineWorkloadChart";
import { TaskStatusChart } from "./charts/TaskStatusChart";
import { PatientStatusChart } from "./charts/PatientStatusChart";
import { WorkloadChart } from "./charts/WorkloadChart";
import { ROUTES } from "@/lib/routes";

interface DashboardViewProps {
    orgId: string;
    userName: string;
    orgName?: string;
}

export function DashboardView({
    orgId,
    userName,
    orgName,
}: DashboardViewProps) {
    const stats = null;
    const isLoading = false;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 w-full">
                {/* Quick Actions */}
                <div className="flex flex-col gap-2 w-auto">
                    <Link href={ROUTES.APP.DOCUMENT_AI(orgId)}>
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full flex items-center gap-2 justify-start border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                        >
                            <Sparkles className="h-4 w-4" />
                            <span className="flex-1">Ask AI Assistant</span>
                        </Button>
                    </Link>
                    <Link href={ROUTES.APP.TRIALS(orgId)}>
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full flex items-center gap-2 justify-start"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="flex-1">Create a New Trial</span>
                        </Button>
                    </Link>
                    <Link href={ROUTES.APP.TRIALS(orgId)}>
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full flex items-center gap-2 justify-start"
                        >
                            <UserPlus className="h-4 w-4" />
                            <span className="flex-1">Sign a New Patient</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Analytics Charts — hidden until useDashboardStats endpoint is ready */}
            {!isLoading && stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <TimelineWorkloadChart timeline={(stats as any).timeline} />
                    <TaskStatusChart stats={(stats as any).tasks} />
                    <PatientStatusChart stats={(stats as any).patients} />
                    <WorkloadChart stats={(stats as any).tasks.byAssignee} />
                </div>
            )}

            {/* My Workload Section */}
            <div className="mt-8">
                <MyWorkload orgId={orgId} />
            </div>
        </div>
    );
}