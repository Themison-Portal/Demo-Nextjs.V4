/**
 * Organizations Table Component
 * Full list of organizations with search, filters and management features
 */

"use client";

import { useState, useMemo } from "react";

import { StatsGrid } from "../shared/StatsGrid";
import { CreateOrgModal } from "./CreateOrgModal";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { CreateOrganizationInput } from "@/services/organizations/types";

type FilterStatus = "all" | "active" | "inactive";

export function OrganizationsTable() {
    const {
        organizations,
        stats,
        isLoading,
        error,
        createOrganization,
        isCreating,
    } = useOrganizations();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

    // Filter and search organizations
    const filteredOrganizations = useMemo(() => {
        return organizations.filter((org) => {
            // Search filter
            const matchesSearch = org.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());

            // Status filter
            const matchesStatus =
                filterStatus === "all" ||
                (filterStatus === "active" && !org.deleted_at) ||
                (filterStatus === "inactive" && org.deleted_at);

            return matchesSearch && matchesStatus;
        });
    }, [organizations, searchQuery, filterStatus]);

    const handleCreateOrg = async (data: CreateOrganizationInput) => {
        try {
            await createOrganization(data);
            setIsCreateModalOpen(false);
        } catch (err) {
            console.error("Failed to create organization:", err);
        }
    };

    return (
        <div className="flex-1 overflow-auto">
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Organizations
                            </h1>
                            <p className="text-sm text-gray-600">
                                Manage all organizations in the platform
                            </p>
                        </div>

                        <Button
                            size="sm"
                            onClick={() => setIsCreateModalOpen(true)}
                            disabled={isLoading || isCreating}
                            className="font-bold"
                        >
                            + New Organization
                        </Button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error.message || "Failed to load organizations"}
                    </div>
                )}

                {/* Stats Grid */}
                <StatsGrid stats={stats} />

                {/* Filters and Search */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search */}
                    <div className="relative flex-1 sm:max-w-md bg-white">
                        <input
                            type="text"
                            placeholder="Search organizations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <svg
                            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterStatus("all")}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filterStatus === "all"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            All ({stats.total})
                        </button>
                        <button
                            onClick={() => setFilterStatus("active")}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filterStatus === "active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            Active ({stats.active})
                        </button>
                        <button
                            onClick={() => setFilterStatus("inactive")}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filterStatus === "inactive"
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-white text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            Inactive ({stats.inactive})
                        </button>
                    </div>
                </div>

                {/* Organizations Table */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-1">
                    <div className="overflow-x-auto">
                        {isLoading && !organizations.length ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                            </div>
                        ) : filteredOrganizations.length === 0 ? (
                            <div className="p-12 text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    No organizations found
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchQuery
                                        ? "Try adjusting your search"
                                        : "Get started by creating a new organization"}
                                </p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200 ">
                                <thead className="bg-gray-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Organization
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Members
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Trials
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Support
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                            Created
                                        </th>
                                        <th className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white ">
                                    {filteredOrganizations.map((org) => (
                                        <tr
                                            key={org.id}
                                            className="transition-colors hover:bg-gray-50"
                                        >
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-200">
                                                        <svg
                                                            className="h-5 w-5 text-gray-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {org.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {org.slug}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                {org.member_count || 0}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                <div className="flex flex-col">
                                                    <span>{org.trial_count || 0} total</span>
                                                    <span className="text-xs text-gray-500">
                                                        {org.active_trial_count || 0} active
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {org.support_enabled ? (
                                                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                                        Enabled
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                                        Disabled
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {org.deleted_at ? (
                                                    <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                                                        Inactive
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                {new Date(org.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium ">
                                                <Link
                                                    href={ROUTES.CONSOLE.ORGANIZATION(org.id)}
                                                    className="p-1 px-2 rounded-md text-blue-600 hover:text-blue-800 font-semibold border border-transparent  hover:border-blue-600 cursor-pointer"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Organization Modal */}
            <CreateOrgModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateOrg}
                isLoading={isCreating}
            />
        </div>
    );
}
