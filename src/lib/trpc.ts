// @ts-nocheck
import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import superjson from 'superjson';

// Define AppRouter type that matches backend structure
type AppRouter = any;

export const trpc = createTRPCReact<AppRouter>();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      transformer: superjson,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        });
      },
    }),
  ],
});
