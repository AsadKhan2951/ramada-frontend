// This file contains type definitions that mirror the backend AppRouter
// In a production setup, you would generate these types from the backend

import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

// Staff member type
export interface StaffMember {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  department: "sales" | "operations" | "food" | "finance";
  accessLevel: "full" | "limited";
  isActive?: boolean;
  lastSignedIn?: Date;
}

// Banquet hall type
export interface BanquetHall {
  id: string;
  name: string;
  capacity: number;
  facilities?: string;
  baseRate?: string;
  isActive: boolean;
}

// Food menu type
export interface FoodMenu {
  id: string;
  name: string;
  description?: string;
  pricePerPerson: string;
  menuItems?: string;
  isActive: boolean;
}

// Additional service type
export interface AdditionalService {
  id: string;
  name: string;
  description?: string;
  price: string;
  category: "sound" | "effects" | "decoration" | "other";
  isActive: boolean;
}

// Booking type
export interface Booking {
  id: string;
  bookingNumber: string;
  banquetHallId: string;
  hallName?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone: string;
  clientCnic?: string;
  clientNtn?: string;
  isTaxFiler: boolean;
  eventDate: Date;
  eventTime?: string;
  eventType?: string;
  numberOfGuests: number;
  expectedGuests?: number;
  roomsRequired: number;
  status: "tentative_block" | "soft_reservation" | "confirmed" | "completed" | "cancelled";
  blockType?: "tentative" | "definite";
  hallRate: string;
  subtotal: string;
  salesTax: string;
  advanceTax: string;
  totalAmount: string;
  paidAmount: string;
  notes?: string;
  createdAt: Date;
}

// Payment type
export interface Payment {
  id: string;
  amount: string;
  paymentType: "token" | "partial" | "final" | "second_payment" | "final_payment";
  paymentStage?: number;
  paymentMethod?: string;
  paymentDate: Date;
  notes?: string;
}

// Dashboard stats type
export interface DashboardStats {
  totalBookings: number;
  softReservations: number;
  confirmedBookings: number;
  todayEvents: number;
  totalRevenue: string;
  totalPaid: string;
  pendingPayments: string;
}

// Notification type
export interface Notification {
  id: string;
  type: "booking_created" | "booking_confirmed" | "payment_due" | "payment_received" | "comment_added" | "status_changed";
  title: string;
  message: string;
  bookingId?: string;
  isRead: boolean;
  createdAt: Date;
}

// Date note type
export interface DateNote {
  id: string;
  date: Date;
  note: string;
  isPrivate: boolean;
  createdBy: string;
}

// This is a placeholder type - in production, you would generate this from the backend
// For now, we define a minimal type that satisfies the tRPC client requirements
export type AppRouter = {
  auth: {
    me: any;
    logout: any;
  };
  staff: {
    login: any;
    list: any;
    getById: any;
  };
  banquetHalls: {
    list: any;
    getById: any;
    create: any;
    update: any;
  };
  foodMenus: {
    list: any;
    getById: any;
    create: any;
    update: any;
  };
  additionalServices: {
    list: any;
    getById: any;
    create: any;
    update: any;
  };
  bookings: {
    list: any;
    getById: any;
    getByStatus: any;
    getByDateRange: any;
    checkAvailability: any;
    createSoftReservation: any;
    confirm: any;
    addPayment: any;
    update: any;
    cancel: any;
  };
  comments: {
    add: any;
    getByBooking: any;
  };
  dateNotes: {
    getByDateRange: any;
    create: any;
    delete: any;
  };
  notifications: {
    list: any;
    unreadCount: any;
    markAsRead: any;
    markAllAsRead: any;
  };
  dashboard: {
    stats: any;
    recentBookings: any;
    upcomingEvents: any;
  };
};

export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
