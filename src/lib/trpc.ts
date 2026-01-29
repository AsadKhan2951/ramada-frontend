import { createTRPCReact } from "@trpc/react-query";

// In a monorepo setup, you would import from the backend:
// import type { AppRouter } from "../../../backend/src/trpc/routers";

// For separate deployment, we use 'any' type to bypass type checking
// The actual type safety comes from the backend at runtime
export const trpc = createTRPCReact<any>();
