/**
 * App Sidebar Component
 * Sidebar navigation for clinic app
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import Image from "next/image";
import {
  LayoutDashboard,
  FlaskConical,
  Users,
  LogOut,
  User,
  Building2,
} from "lucide-react";

interface SidebarItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

function SidebarItem({ href, label, icon, active }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-sm px-2 py-2 text-sm font-normal transition-colors",
        active
          ? "bg-gray-100 text-gray-900"
          : "text-gray-900 hover:bg-gray-200 hover:text-gray-800"
      )}
    >
      <div className="h-4 w-4">{icon}</div>
      <p className="font-normal">{label}</p>
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

  return (
    <div className="flex h-screen w-[15%] min-w-44 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-12 items-center border-b border-gray-200 px-4">
        <div className="text-lg font-extrabold text-gray-900 flex items-center justify-center w-full">
          <Image src={"/logo.svg"} width={100} height={10} alt="logo" />{" "}
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

        {/* <SidebarItem
          href={ROUTES.APP.PATIENTS(orgId)}
          label="Patients"
          icon={<Users className="h-4 w-4" />}
          active={pathname?.startsWith(ROUTES.APP.PATIENTS(orgId))}
        /> */}

        <SidebarItem
          href={ROUTES.APP.ORGANIZATION(orgId)}
          label="Organization"
          icon={<Building2 className="h-4 w-4" />}
          active={pathname?.startsWith(ROUTES.APP.ORGANIZATION(orgId))}
        />
      </nav>

      {/* User info */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="truncate text-xs font-medium text-gray-900 capitalize">
              <p>{userFirstName}</p>
            </div>
            <div className="text-xs text-gray-400">
              <p>{userEmail}</p>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-gray-400 hover:text-gray-900 flex items-center justify-center rounded-md p-2 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
