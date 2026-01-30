import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  Building2,
  ArrowRight,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { format, differenceInDays, startOfMonth, endOfMonth, isToday, isTomorrow, addDays } from "date-fns";
import { useMemo } from "react";
import { useLocation } from "wouter";

interface BookiGreetingProps {
  onChatOpen?: () => void;
}

interface StaffSession {
  id: number;
  name: string;
  email: string;
  jobTitle: string;
  department: string;
  accessLevel: string;
}

export function BookiGreeting({ onChatOpen }: BookiGreetingProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get staff session from localStorage
  const staffSession: StaffSession | null = (() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("staffSession");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  })();
  
  // Use staff name if available, otherwise OAuth user name
  const displayName = staffSession?.name || user?.name || "User";
  const { data: bookings = [] } = trpc.bookings.list.useQuery();
  const { data: halls = [] } = trpc.banquetHalls.list.useQuery();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Calculate insights
  const insights = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    // Today's events
    const todayEvents = bookings.filter((b) => {
      const eventDate = new Date(b.eventDate);
      return isToday(eventDate) && b.status !== "cancelled";
    });

    // Tomorrow's events
    const tomorrowEvents = bookings.filter((b) => {
      const eventDate = new Date(b.eventDate);
      return isTomorrow(eventDate) && b.status !== "cancelled";
    });

    // This week's events (next 7 days)
    const weekEvents = bookings.filter((b) => {
      const eventDate = new Date(b.eventDate);
      const daysUntil = differenceInDays(eventDate, today);
      return daysUntil >= 0 && daysUntil <= 7 && b.status !== "cancelled";
    });

    // Soft reservations to convert
    const softReservations = bookings.filter(
      (b) => (b.status as string) === "soft_reservation" || (b.status as string) === "soft reservation"
    );

    // Payment follow-ups (bookings with pending payments in next 20 days)
    const paymentFollowUps = bookings.filter((b) => {
      const eventDate = new Date(b.eventDate);
      const daysUntil = differenceInDays(eventDate, today);
      const paid = parseFloat(b.paidAmount || "0");
      const total = parseFloat(b.totalAmount || "0");
      return (
        daysUntil > 0 &&
        daysUntil <= 20 &&
        paid < total &&
        b.status !== "cancelled"
      );
    });

    // Monthly stats
    const monthlyBookings = bookings.filter((b) => {
      const createdAt = new Date(b.createdAt);
      return createdAt >= monthStart && createdAt <= monthEnd;
    });

    const confirmedThisMonth = monthlyBookings.filter(
      (b) => b.status === "confirmed"
    ).length;

    const monthlyRevenue = monthlyBookings.reduce(
      (sum, b) => sum + parseFloat(b.totalAmount || "0"),
      0
    );

    // Sales target (example: 50 bookings per month, 10M PKR revenue)
    const bookingTarget = 50;
    const revenueTarget = 10000000;
    const bookingProgress = Math.min(
      (monthlyBookings.length / bookingTarget) * 100,
      100
    );
    const revenueProgress = Math.min((monthlyRevenue / revenueTarget) * 100, 100);

    // Available halls for next 7 days
    const availableDates: { date: Date; halls: string[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const checkDate = addDays(today, i);
      const bookedHallIds = bookings
        .filter((b) => {
          const eventDate = new Date(b.eventDate);
          return (
            eventDate.toDateString() === checkDate.toDateString() &&
            b.status !== "cancelled"
          );
        })
        .map((b) => b.banquetHallId);

      const availableHalls = halls.filter((h) => !bookedHallIds.includes(h.id));
      if (availableHalls.length > 0) {
        availableDates.push({
          date: checkDate,
          halls: availableHalls.map((h) => h.name),
        });
      }
    }

    return {
      todayEvents,
      tomorrowEvents,
      weekEvents,
      softReservations,
      paymentFollowUps,
      monthlyBookings: monthlyBookings.length,
      confirmedThisMonth,
      monthlyRevenue,
      bookingProgress,
      revenueProgress,
      availableDates,
    };
  }, [bookings, halls]);

  const firstName = displayName.split(" ")[0] || "there";

  return (
    <Card className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white border-0 shadow-lg overflow-hidden">
      <CardContent className="p-3 sm:p-4 md:p-6">
        {/* Header - Compact on mobile */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-bold">Booki</h2>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0">
                  AI
                </Badge>
              </div>
              <p className="text-zinc-400 text-xs hidden sm:block">Sales Intelligence</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-zinc-400 text-[10px] sm:text-xs">{format(new Date(), "EEE")}</p>
            <p className="text-xs sm:text-sm font-medium">{format(new Date(), "MMM d")}</p>
          </div>
        </div>

        {/* Greeting - Compact */}
        <div className="mb-3 sm:mb-4">
          <h1 className="text-base sm:text-xl font-bold">
            {getGreeting()}, {firstName}! 👋
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm line-clamp-1">
            {insights.softReservations.length > 0
              ? `${insights.softReservations.length} soft reservations to convert`
              : "No pending conversions"}
          </p>
        </div>

        {/* Quick Stats - Horizontal scroll on mobile, compact */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 sm:mb-4 snap-x scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 sm:gap-3">
          <div className="bg-white/10 rounded-lg p-2 sm:p-3 min-w-[80px] sm:min-w-0 snap-center flex-shrink-0 sm:flex-shrink">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="h-3 w-3 text-blue-400" />
              <span className="text-[10px] text-zinc-400">Today</span>
            </div>
            <p className="text-lg sm:text-xl font-bold">{insights.todayEvents.length}</p>
          </div>

          <div className="bg-white/10 rounded-lg p-2 sm:p-3 min-w-[80px] sm:min-w-0 snap-center flex-shrink-0 sm:flex-shrink">
            <div className="flex items-center gap-1 mb-1">
              <Phone className="h-3 w-3 text-orange-400" />
              <span className="text-[10px] text-zinc-400">Follow</span>
            </div>
            <p className="text-lg sm:text-xl font-bold">{insights.paymentFollowUps.length}</p>
          </div>

          <div className="bg-white/10 rounded-lg p-2 sm:p-3 min-w-[80px] sm:min-w-0 snap-center flex-shrink-0 sm:flex-shrink">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-yellow-400" />
              <span className="text-[10px] text-zinc-400">Convert</span>
            </div>
            <p className="text-lg sm:text-xl font-bold">{insights.softReservations.length}</p>
          </div>

          <div className="bg-white/10 rounded-lg p-2 sm:p-3 min-w-[80px] sm:min-w-0 snap-center flex-shrink-0 sm:flex-shrink">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-[10px] text-zinc-400">Week</span>
            </div>
            <p className="text-lg sm:text-xl font-bold">{insights.weekEvents.length}</p>
          </div>
        </div>

        {/* Progress Bars - Side by side on mobile */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="bg-white/10 rounded-lg p-2 sm:p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-xs font-medium">Bookings</span>
              <span className="text-[10px] text-zinc-400">{insights.monthlyBookings}/50</span>
            </div>
            <Progress value={insights.bookingProgress} className="h-1.5 bg-white/20" />
          </div>

          <div className="bg-white/10 rounded-lg p-2 sm:p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-xs font-medium">Revenue</span>
              <span className="text-[10px] text-zinc-400">{(insights.monthlyRevenue / 1000000).toFixed(1)}M</span>
            </div>
            <Progress value={insights.revenueProgress} className="h-1.5 bg-white/20" />
          </div>
        </div>

        {/* Action Items - Collapsible on mobile, show only if data exists */}
        <div className="hidden sm:grid grid-cols-2 gap-3 mb-4">
          {insights.paymentFollowUps.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-xs font-medium text-orange-400">Follow-ups</span>
              </div>
              <div className="space-y-1">
                {insights.paymentFollowUps.slice(0, 2).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 rounded p-1 -mx-1"
                    onClick={() => setLocation(`/booking/${booking.id}`)}
                  >
                    <span className="text-zinc-300 truncate">{booking.clientName}</span>
                    <span className="text-orange-400 flex-shrink-0 ml-2">
                      {differenceInDays(new Date(booking.eventDate), new Date())}d
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.availableDates.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Building2 className="h-3.5 w-3.5 text-green-400" />
                <span className="text-xs font-medium text-green-400">Availability</span>
              </div>
              <div className="space-y-1">
                {insights.availableDates.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">
                      {isToday(item.date) ? "Today" : isTomorrow(item.date) ? "Tomorrow" : format(item.date, "EEE")}
                    </span>
                    <span className="text-green-400">{item.halls.length} halls</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions - Compact buttons */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
          <Button
            onClick={() => setLocation("/booking/create")}
            size="sm"
            className="bg-white text-zinc-900 hover:bg-zinc-100 text-xs h-8 px-3 flex-shrink-0"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            New Booking
          </Button>
          {onChatOpen && (
            <Button
              onClick={onChatOpen}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 text-xs h-8 px-3 flex-shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Chat
            </Button>
          )}
          <Button
            onClick={() => setLocation("/sales/reports")}
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10 text-xs h-8 px-3 flex-shrink-0"
          >
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
            Reports
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
