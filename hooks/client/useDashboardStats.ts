// /**
//  * Dashboard Stats Hook
//  * TanStack Query wrapper for dashboard statistics
//  */

// import { useQuery } from "@tanstack/react-query";
// import { getDashboardStats } from "@/services/client/dashboard";

// export function useDashboardStats(orgId: string) {
//   return useQuery({
//     queryKey: ["client", "dashboard", "stats", orgId],
//     queryFn: () => getDashboardStats(orgId),
//     staleTime: 1000 * 60 * 2, // 2 minutes - dashboard data can be slightly stale
//     refetchOnWindowFocus: true,
//   });
// }
