// This file defines the AppRouter type that matches the backend structure
// This is a workaround since we can't import directly from the backend

import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

// Define the router type structure
export type AppRouter = {
  _def: {
    _config: {
      $types: any;
    };
    procedures: any;
    record: {
      auth: any;
      staff: any;
      banquetHalls: any;
      foodMenus: any;
      additionalServices: any;
      bookings: any;
      comments: any;
      bookingComments: any;
      customFoodItems: any;
      activityLog: any;
      dateNotes: any;
      notifications: any;
      dashboard: any;
    };
  };
};

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
