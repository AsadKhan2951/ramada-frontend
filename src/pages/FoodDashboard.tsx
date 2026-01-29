import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Calendar, Plus, Filter, Search, LayoutGrid, List } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import CalendarView from "@/components/CalendarView";

export default function SalesDashboard() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: bookings, isLoading } = trpc.bookings.list.useQuery();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "soft_reservation": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "confirmed": return "bg-green-100 text-green-800 border-green-300";
      case "completed": return "bg-blue-100 text-blue-800 border-blue-300";
      case "cancelled": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
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
        title="Food & Beverage Dashboard"
        navItems={[
          { label: "Dashboard", href: "/food", icon: LayoutGrid },
          { label: "Create Booking", href: "/booking/create", icon: Plus },
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
      title="Food & Beverage Dashboard"
      navItems={[
        { label: "Dashboard", href: "/food", icon: LayoutGrid },
        { label: "Create Booking", href: "/booking/create", icon: Plus },
      ]}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Bookings</CardDescription>
              <CardTitle className="text-3xl">{bookings?.length || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Soft Reservations</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">
                {bookings?.filter(b => b.status === "soft_reservation").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Confirmed</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {bookings?.filter(b => b.status === "confirmed").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Upcoming (30 days)</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {upcomingBookings.length}
              </CardTitle>
            </CardHeader>
          </Card>
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
