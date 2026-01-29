import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardHeader } from "@/components/DashboardHeader";
import { NotificationPanel } from "@/components/NotificationPanel";
import { AdvancedSearchDialog } from "@/components/AdvancedSearchDialog";
import { SalesStatsCards } from "@/components/SalesStatsCards";
import { SalesCharts } from "@/components/SalesCharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Calendar, Plus, Filter, Search, LayoutGrid, List, BarChart3, TrendingUp, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { format, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import CalendarView from "@/components/CalendarView";

export default function SalesDashboard() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  const { data: bookings, isLoading } = trpc.bookings.list.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();

  // Get staff session for greeting
  const [staffName, setStaffName] = useState("User");
  useEffect(() => {
    const staffSession = localStorage.getItem("staffSession");
    if (staffSession) {
      const staff = JSON.parse(staffSession);
      setStaffName(staff.name?.split(" ")[0] || "User");
    }
  }, []);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Filter bookings
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    
    let filtered = bookings;
    
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.status === statusFilter);
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.clientName.toLowerCase().includes(query) ||
        b.bookingNumber.toLowerCase().includes(query) ||
        b.clientPhone.includes(query)
      );
    }
    
    return filtered;
  }, [bookings, statusFilter, searchQuery]);

  // Upcoming bookings (next 30 days)
  const upcomingBookings = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return filteredBookings.filter(b => {
      const eventDate = new Date(b.eventDate);
      return eventDate >= now && eventDate <= thirtyDaysFromNow && b.status !== "cancelled";
    }).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [filteredBookings]);

  // Today's events
  const todaysEvents = useMemo(() => {
    if (!bookings) return [];
    const today = new Date();
    return bookings.filter(b => {
      const eventDate = new Date(b.eventDate);
      return eventDate.toDateString() === today.toDateString() && b.status !== "cancelled";
    });
  }, [bookings]);

  // Payment follow-ups needed (bookings with pending payments in next 20 days)
  const paymentFollowUps = useMemo(() => {
    if (!bookings) return [];
    const now = new Date();
    return bookings.filter(b => {
      if (b.status !== "confirmed") return false;
      const eventDate = new Date(b.eventDate);
      const daysUntilEvent = differenceInDays(eventDate, now);
      // Check if payment is due soon (within 20 days)
      return daysUntilEvent > 0 && daysUntilEvent <= 20;
    }).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [bookings]);

  // Soft reservations to convert
  const softReservationsToConvert = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter(b => 
      (b.status as string) === "soft_reservation" || (b.status as string) === "soft reservation"
    ).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [bookings]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!bookings) return {
      totalBookings: 0,
      softReservations: 0,
      confirmedBookings: 0,
      upcomingEvents: 0,
      monthlyRevenue: 0,
      conversionRate: 0,
    };

    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const softReservations = bookings.filter(
      (b) => (b.status as string) === "soft_reservation" || (b.status as string) === "soft reservation"
    ).length;
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;

    const monthlyBookings = bookings.filter((b) => {
      const createdAt = new Date(b.createdAt);
      return createdAt >= monthStart && createdAt <= monthEnd;
    });

    const monthlyRevenue = monthlyBookings.reduce(
      (sum, b) => sum + parseFloat(b.totalAmount || "0"),
      0
    );

    const conversionRate = bookings.length > 0
      ? ((confirmedBookings / bookings.length) * 100)
      : 0;

    return {
      totalBookings: bookings.length,
      softReservations,
      confirmedBookings,
      upcomingEvents: upcomingBookings.length,
      monthlyRevenue,
      conversionRate,
    };
  }, [bookings, upcomingBookings]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "soft_reservation": return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
      case "confirmed": return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "completed": return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      case "cancelled": return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      default: return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setLocation(`/booking/${booking.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.clientName}</CardTitle>
            <CardDescription className="mt-1">
              {booking.bookingNumber}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(booking.eventDate), "PPP")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hall:</span>
            <span className="font-medium">{booking.hall?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Guests:</span>
            <span className="font-medium">{booking.numberOfGuests}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold">PKR {parseFloat(booking.totalAmount).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <DashboardLayout
        title="Sales Dashboard"
        navItems={[
          { label: "Dashboard", href: "/sales", icon: LayoutGrid },
          { label: "Create Booking", href: "/booking/create", icon: Plus },
          { label: "Reports", href: "/sales/reports", icon: BarChart3 },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading bookings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Sales Dashboard"
      navItems={[
        { label: "Dashboard", href: "/sales", icon: LayoutGrid },
        { label: "Create Booking", href: "/booking/create", icon: Plus },
        { label: "Reports", href: "/sales/reports", icon: BarChart3 },
      ]}
    >
      <DashboardHeader
        onSearchClick={() => setShowAdvancedSearch(true)}
        onNotificationsClick={() => setShowNotifications(true)}
        unreadCount={unreadCount}
      />
      
      <NotificationPanel
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      
      <AdvancedSearchDialog
        open={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
      />

      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
        {/* Welcome & Summary Section */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Greeting */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  {getGreeting()}, {staffName}! 👋
                </h1>
                <p className="text-gray-300 mt-1 text-sm sm:text-base">
                  {format(new Date(), "EEEE, MMMM d, yyyy")}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">{todaysEvents.length}</div>
                  <div className="text-xs text-gray-300">Today's Events</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">{paymentFollowUps.length}</div>
                  <div className="text-xs text-gray-300">Payment Follow-ups</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">{softReservationsToConvert.length}</div>
                  <div className="text-xs text-gray-300">To Convert</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold">{upcomingBookings.length}</div>
                  <div className="text-xs text-gray-300">This Week</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/20">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setLocation("/booking/create")}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Booking
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation("/sales/reports")}
                className="border-white/30 text-white hover:bg-white/10"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards with flat black/white icons */}
        <SalesStatsCards
          totalBookings={stats.totalBookings}
          softReservations={stats.softReservations}
          confirmedBookings={stats.confirmedBookings}
          upcomingEvents={stats.upcomingEvents}
          monthlyRevenue={stats.monthlyRevenue}
          conversionRate={stats.conversionRate}
          onFilterChange={(filter) => {
            if (filter === "upcoming") {
              setViewMode("list");
              setStatusFilter("all");
              // Scroll to upcoming tab
              const upcomingTab = document.querySelector('[value="upcoming"]');
              if (upcomingTab) (upcomingTab as HTMLElement).click();
            } else {
              setViewMode("list");
              setStatusFilter(filter);
              // Switch to all bookings tab for filtering
              const allTab = document.querySelector('[value="all"]');
              if (allTab) (allTab as HTMLElement).click();
            }
          }}
        />

        {/* Charts Section - Hidden on mobile for cleaner view */}
        <div className="hidden sm:block space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Sales Analytics</h2>
            <Button variant="outline" onClick={() => setLocation("/sales/reports")}>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Full Reports
            </Button>
          </div>
          <SalesCharts bookings={bookings || []} />
        </div>

        {/* View Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-2" />
              List View
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </Button>
          </div>
          
          <Button onClick={() => setLocation("/booking/create")}>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>

        {viewMode === "calendar" ? (
          <CalendarView />
        ) : (
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="all">All Bookings</TabsTrigger>
            </TabsList>

            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, booking number, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="soft_reservation">Soft Reservation</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No upcoming bookings in the next 30 days</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {filteredBookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No bookings found matching your filters</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
