import { trpc } from '@/lib/trpc';

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  accessLevel: string;
  jobTitle: string;
}

export function useAuth() {
  const { data: user, isLoading: loading, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = '/login';
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user as User | null,
    loading,
    logout,
    refetch,
  };
}

export function getLoginUrl() {
  return '/login';
}
