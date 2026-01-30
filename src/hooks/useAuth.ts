import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  accessLevel: string;
  jobTitle: string;
}

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};

  // Read local session first (works even if cross-site cookies are blocked)
  const staffSession = useMemo(() => {
    if (typeof window === "undefined") return null;
    const session = localStorage.getItem("staffSession");
    if (!session) return null;
    try {
      return JSON.parse(session) as User;
    } catch {
      return null;
    }
  }, []);

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: Boolean(staffSession),
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        // Ignore unauth on logout
      }
    } finally {
      localStorage.removeItem("staffSession");
      window.location.href = getLoginUrl();
    }
  }, [logoutMutation]);

  const user = (staffSession || meQuery.data || null) as User | null;
  const loading = staffSession ? false : meQuery.isLoading || logoutMutation.isPending;

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, loading, user]);

  return {
    user,
    loading,
    logout,
    refetch: () => meQuery.refetch(),
  };
}

export function getLoginUrl() {
  return "/login";
}
