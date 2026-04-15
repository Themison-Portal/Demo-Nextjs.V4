/**
 * App Sidebar Component
 * Sidebar navigation for clinic app
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { usePermissions } from "@/hooks/usePermissions";
import { useThreads } from "@/hooks/client/useThreads";
import { useAuth } from "@/hooks/useAuth";
import { ChatHistorySection } from "@/components/app/documentAI/ChatHistorySection";
import Image from "next/image";
import { getAuth0Client } from "@/lib/auth0";
import {
    LayoutDashboard,
    FlaskConical,
    Users,
    LogOut,
    User,
    Building2,
    ClipboardList,
    Sparkles,
    Mail,
} from "lucide-react";

interface SidebarItemProps {
    href: string;
    label: string;
    icon: React.ReactNode;
    active?: boolean;
    badge?: number;
}

function SidebarItem({ href, label, icon, active, badge }: SidebarItemProps) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-2 rounded-sm px-2 py-2 text-sm font-medium transition-colors",
                active
                    ? "bg-gray-100 text-blue-700"
                    : "text-gray-800 hover:bg-gray-200 hover:text-gray-800",
            )}
        >
            <div className="h-4 w-4">{icon}</div>
            <p className="flex-1">{label}</p>
            {badge !== undefined && badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
                    {badge > 99 ? "99+" : badge}
                </span>
            )}
        </Link>
    );
}

interface AppSidebarProps {
    orgId: string;
    userEmail?: string;
    userFirstName?: string;
}

export function AppSidebar({
    orgId,
    userEmail,
    userFirstName,
}: AppSidebarProps) {
    const pathname = usePathname();
    const { canManageOrg } = usePermissions(orgId);
    const { user } = useAuth();

    const { threads } = useThreads(orgId);

    const unreadCount = threads.filter((thread) => {
        const currentUserParticipant = thread.participants?.find(
            (p) => p.user_id === user?.id,
        );
        const lastMessage = thread.messages?.[thread.messages.length - 1];
        return (
            currentUserParticipant &&
            (!currentUserParticipant.last_read_message_id ||
                (lastMessage &&
                    lastMessage.id !== currentUserParticipant.last_read_message_id))
        );
    }).length;

    return (
        <div className="flex h-screen w-[15%] min-w-44 flex-col border-r border-gray-200 bg-white">
            {/* Logo */}
            <div className="flex h-12 items-center border-b border-gray-200 px-4">
                <div className="text-lg font-extrabold text-gray-900 flex items-center justify-center w-full">
                    <Image src={"/logo.svg"} width={100} height={10} alt="logo" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 py-4 px-2">
                <SidebarItem
                    href={ROUTES.APP.DASHBOARD(orgId)}
                    label="Dashboard"
                    icon={<LayoutDashboard className="h-4 w-4" />}
                    active={pathname === ROUTES.APP.DASHBOARD(orgId)}
                />
                <SidebarItem
                    href={ROUTES.APP.TRIALS(orgId)}
                    label="Trials"
                    icon={<FlaskConical className="h-4 w-4" />}
                    active={pathname?.startsWith(ROUTES.APP.TRIALS(orgId))}
                />
                <SidebarItem
                    href={ROUTES.APP.DOCUMENT_AI(orgId)}
                    label="Document AI"
                    icon={<Sparkles className="h-4 w-4" />}
                    active={pathname?.startsWith(ROUTES.APP.DOCUMENT_AI(orgId))}
                />
                <SidebarItem
                    href={ROUTES.APP.TASKS(orgId)}
                    label="Tasks"
                    icon={<ClipboardList className="h-4 w-4" />}
                    active={pathname?.startsWith(ROUTES.APP.TASKS(orgId))}
                />
                <SidebarItem
                    href={ROUTES.APP.MESSAGES(orgId)}
                    label="Messages"
                    icon={<Mail className="h-4 w-4" />}
                    active={pathname?.startsWith(ROUTES.APP.MESSAGES(orgId))}
                    badge={unreadCount}
                />
                <SidebarItem
                    href={ROUTES.APP.ORGANIZATION(orgId)}
                    label="Organization"
                    icon={<Building2 className="h-4 w-4" />}
                    active={pathname?.startsWith(ROUTES.APP.ORGANIZATION(orgId))}
                />

                {/* Chat History Section */}
                <div className="border-t border-gray-200 mt-2 pt-2 h-auto">
                    <ChatHistorySection orgId={orgId} />
                </div>
            </nav>

            {/* User info */}
            <div className="border-t border-gray-200 p-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
                        <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-xs font-medium text-gray-900 capitalize">
                            {userFirstName}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                            {userEmail}
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            localStorage.removeItem('access_token');
                            document.cookie = 'access_token=; path=/; max-age=0';
                            const auth0 = getAuth0Client();
                            await auth0.logout({
                                logoutParams: { returnTo: window.location.origin }
                            });
                        }}
                        className="shrink-0 text-gray-400 hover:text-red-600 flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors text-xs"
                        title="Sign out"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign out</span>
                    </button>
                </div>
            </div>
        </div>
    );
}