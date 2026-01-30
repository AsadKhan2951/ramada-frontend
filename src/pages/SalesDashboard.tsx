import { useState, useMemo, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardHeader } from "@/components/DashboardHeader";
import { NotificationPanel } from "@/components/NotificationPanel";
import { AdvancedSearchDialog } from "@/components/AdvancedSearchDialog";
import { SalesStatsCards } from "@/components/SalesStatsCards";
import { SalesCharts } from "@/components/SalesCharts";
import { WidgetGrid, WidgetConfig } from "@/components/WidgetGrid";
import { WidgetManager, DEFAULT_WIDGETS, AVAILABLE_WIDGETS } from "@/components/WidgetManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Calendar, Plus, LayoutGrid, List, BarChart3, TrendingUp, Clock, AlertCircle, CheckCircle2, Settings2 } from "lucide-react";
import { useLocation } from "wouter";
import { format, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import CalendarView from "@/components/CalendarView";

const WIDGETS_STORAGE_KEY = "dashboard-widgets";

export default function SalesDashboard() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showWidgetManager, setShowWidgetManager] = useState(false);
  const [isEditingWidgets, setIsEditingWidgets] = useState(false);
  
  // Widget state with localStorage persistence
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(WIDGETS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
    } catch {
      return DEFAULT_WIDGETS;
    }
  });

  // Save widgets to localStorage when they change
  useEffect(() => {
    localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);
  
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

  // Upcoming bookings (next 30 days)
  const upcomingBookings = useMemo(() => {
    if (!bookings) return [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return bookings.filter(b => {
      const eventDate = new Date(b.eventDate);
      return eventDate >= now && eventDate <= thirtyDaysFromNow && b.status !== "cancelled";
    }).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [bookings]);

  // Today's events
  const todaysEvents = useMemo(() => {
    if (!bookings) return [];
    const today = new Date();
    return bookings.filter(b => {
      const eventDate = new Date(b.eventDate);
      return eventDate.toDateString() === today.toDateString() && b.status !== "cancelled";
    });
  }, [bookings]);

  // Payment follow-ups needed
  const paymentFollowUps = useMemo(() => {
    if (!bookings) return [];
    const now = new Date();
    return bookings.filter(b => {
      if (b.status !== "confirmed") return false;
      const eventDate = new Date(b.eventDate);
      const daysUntilEvent = differenceInDays(eventDate, now);
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

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  }, []);

  // Render individual widget content based on type
  const renderWidgetContent = useCallback((widget: WidgetConfig) => {
    switch (widget.type) {
      case "viewToggle":
        return (
          <div className="space-y-4">
            {/* View Toggle Buttons */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Booking Views</h3>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  List View
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Calendar View
                </Button>
              </div>
            </div>
            
            {/* View Content */}
            {viewMode === "calendar" ? (
              <div className="h-[500px] sm:h-[600px]">
                <CalendarView />
              </div>
            ) : (
              <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="soft">Soft Reservations</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming" className="mt-4">
                  <div className="space-y-2">
                    {upcomingBookings.slice(0, 10).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => setLocation(`/booking/${booking.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{booking.clientName}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(booking.eventDate), "PPP")} • {booking.numberOfGuests} guests
                          </div>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                    {upcomingBookings.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No upcoming events
                      </div>
                    )}
                    {upcomingBookings.length > 10 && (
                      <Button variant="outline" className="w-full" onClick={() => setLocation("/bookings")}>
                        View All ({upcomingBookings.length})
                      </Button>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="soft" className="mt-4">
                  <div className="space-y-2">
                    {softReservationsToConvert.slice(0, 10).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => setLocation(`/booking/${booking.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{booking.clientName}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(booking.eventDate), "PPP")}
                          </div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          Pending
                        </Badge>
                      </div>
                    ))}
                    {softReservationsToConvert.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No soft reservations
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="recent" className="mt-4">
                  <div className="space-y-2">
                    {(bookings?.slice().sort((a, b) => 
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    ).slice(0, 10) || []).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => setLocation(`/booking/${booking.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{booking.clientName}</div>
                          <div className="text-sm text-muted-foreground">
                            Created {format(new Date(booking.createdAt), "PPP")}
                          </div>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        );

      case "calendarView":
        return (
          <div className="h-[500px] sm:h-[600px]">
            <CalendarView />
          </div>
        );

      case "listView":
        return (
          <div className="space-y-4">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="soft">Soft Reservations</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="mt-4">
                <div className="space-y-2">
                  {upcomingBookings.slice(0, 10).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/booking/${booking.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{booking.clientName}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(booking.eventDate), "PPP")} • {booking.numberOfGuests} guests
                        </div>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                  {upcomingBookings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No upcoming events
                    </div>
                  )}
                  {upcomingBookings.length > 10 && (
                    <Button variant="outline" className="w-full" onClick={() => setLocation("/bookings")}>
                      View All ({upcomingBookings.length})
                    </Button>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="soft" className="mt-4">
                <div className="space-y-2">
                  {softReservationsToConvert.slice(0, 10).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/booking/${booking.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{booking.clientName}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(booking.eventDate), "PPP")}
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        Pending
                      </Badge>
                    </div>
                  ))}
                  {softReservationsToConvert.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No soft reservations
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="recent" className="mt-4">
                <div className="space-y-2">
                  {(bookings?.slice().sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  ).slice(0, 10) || []).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/booking/${booking.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{booking.clientName}</div>
                        <div className="text-sm text-muted-foreground">
                          Created {format(new Date(booking.createdAt), "PPP")}
                        </div>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );

      case "greeting":
        return (
          <Card className="text-white border-0 h-full" style={{ background: 'linear-gradient(to bottom right, #FA2B00, #FF4D26)' }}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">
                    {getGreeting()}, {staffName}! 👋
                  </h1>
                  <p className="text-white/80 mt-1 text-sm sm:text-base">
                    {format(new Date(), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-yellow-300 mb-1">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold">{todaysEvents.length}</div>
                    <div className="text-xs text-white/80">Today's Events</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-orange-300 mb-1">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold">{paymentFollowUps.length}</div>
                    <div className="text-xs text-white/80">Payment Follow-ups</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-300 mb-1">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold">{softReservationsToConvert.length}</div>
                    <div className="text-xs text-white/80">To Convert</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-green-300 mb-1">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold">{upcomingBookings.length}</div>
                    <div className="text-xs text-white/80">This Week</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/20">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setLocation("/booking/create")}
                  className="bg-white hover:bg-white/90" style={{ color: '#FA2B00' }}
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
        );

      case "stats":
        return (
          <SalesStatsCards
            totalBookings={stats.totalBookings}
            softReservations={stats.softReservations}
            confirmedBookings={stats.confirmedBookings}
            upcomingEvents={stats.upcomingEvents}
            monthlyRevenue={stats.monthlyRevenue}
            conversionRate={stats.conversionRate}
            onFilterChange={() => {}}
          />
        );

      case "charts":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Sales Analytics</h2>
              <Button variant="outline" size="sm" onClick={() => setLocation("/sales/reports")}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Full Reports
              </Button>
            </div>
            <SalesCharts bookings={bookings || []} />
          </div>
        );

      case "upcoming":
        return (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Upcoming Events</h3>
            {upcomingBookings.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => setLocation(`/booking/${booking.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{booking.clientName}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(booking.eventDate), "PPP")}
                  </div>
                </div>
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
            {upcomingBookings.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No upcoming events
              </div>
            )}
            {upcomingBookings.length > 5 && (
              <Button variant="outline" className="w-full" onClick={() => setLocation("/bookings")}>
                View All ({upcomingBookings.length})
              </Button>
            )}
          </div>
        );

      case "todayEvents":
        return (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Today's Events</h3>
            {todaysEvents.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => setLocation(`/booking/${booking.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{booking.clientName}</div>
                  <div className="text-sm text-muted-foreground">
                    {booking.numberOfGuests} guests
                  </div>
                </div>
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
            {todaysEvents.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No events today
              </div>
            )}
          </div>
        );

      case "paymentFollowups":
        return (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Payment Follow-ups</h3>
            {paymentFollowUps.slice(0, 5).map((booking) => {
              const paid = parseFloat(booking.paidAmount || "0");
              const total = parseFloat(booking.totalAmount || "1");
              const percentage = (paid / total) * 100;
              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/booking/${booking.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{booking.clientName}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(booking.eventDate), "PPP")}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    {percentage.toFixed(0)}% paid
                  </Badge>
                </div>
              );
            })}
            {paymentFollowUps.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No payment follow-ups needed
              </div>
            )}
          </div>
        );

      case "softReservations":
        return (
          <div className="space-y-3">
            {softReservationsToConvert.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => setLocation(`/booking/${booking.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{booking.clientName}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(booking.eventDate), "PPP")}
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Pending
                </Badge>
              </div>
            ))}
            {softReservationsToConvert.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No soft reservations
              </div>
            )}
          </div>
        );

      case "quickActions":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => setLocation("/booking/create")}>
              <Plus className="h-4 w-4 mr-1" />
              New Booking
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/bookings")}>
              <List className="h-4 w-4 mr-1" />
              All Bookings
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/sales/reports")}>
              <BarChart3 className="h-4 w-4 mr-1" />
              Reports
            </Button>
            <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}>
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </Button>
          </div>
        );

      case "calendarMini":
        return (
          <div className="h-[300px]">
            <CalendarView />
          </div>
        );

      case "recentBookings":
        const recentBookings = bookings?.slice().sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 5) || [];
        return (
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => setLocation(`/booking/${booking.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{booking.clientName}</div>
                  <div className="text-sm text-muted-foreground">
                    Created {format(new Date(booking.createdAt), "PPP")}
                  </div>
                </div>
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
            {recentBookings.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No recent bookings
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-4 text-muted-foreground">
            Widget not found
          </div>
        );
    }
  }, [bookings, staffName, stats, todaysEvents, paymentFollowUps, softReservationsToConvert, upcomingBookings, viewMode, setLocation]);

  const navItems = [
    { label: "Dashboard", href: "/sales", icon: LayoutGrid },
    { label: "All Bookings", href: "/bookings", icon: List },
    { label: "Create Booking", href: "/booking/create", icon: Plus },
    { label: "Reports", href: "/sales/reports", icon: BarChart3 },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title="Sales Dashboard" navItems={navItems}>
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
    <DashboardLayout title="Sales Dashboard" navItems={navItems}>
      <DashboardHeader
        onSearchClick={() => setShowAdvancedSearch(true)}
        onNotificationsClick={() => setShowNotifications(true)}
        onWidgetsClick={() => setShowWidgetManager(true)}
        showWidgetsButton={true}
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

      <WidgetManager
        open={showWidgetManager}
        onClose={() => setShowWidgetManager(false)}
        widgets={widgets}
        onWidgetsChange={setWidgets}
        isEditing={isEditingWidgets}
        onEditingChange={setIsEditingWidgets}
      />

      <div className="p-3 sm:p-4 md:p-6">
        {/* Edit Mode Banner */}
        {isEditingWidgets && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Edit Mode Active</span>
              <span className="text-sm text-muted-foreground">- Drag widgets to rearrange</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsEditingWidgets(false)}>
              Done Editing
            </Button>
          </div>
        )}

        {/* Widget Grid */}
        <WidgetGrid
          widgets={widgets}
          onWidgetsChange={setWidgets}
          onRemoveWidget={handleRemoveWidget}
          renderWidget={renderWidgetContent}
          isEditing={isEditingWidgets}
        />

        {/* View Toggle and Calendar (if no calendar widget) */}
        {!widgets.some(w => w.type === "calendarMini") && (
          <div className="mt-6 space-y-4">
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
            </div>

            {viewMode === "calendar" && <CalendarView />}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
