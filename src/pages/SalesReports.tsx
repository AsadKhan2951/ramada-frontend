import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardHeader } from "@/components/DashboardHeader";
import { NotificationPanel } from "@/components/NotificationPanel";
import { AdvancedSearchDialog } from "@/components/AdvancedSearchDialog";
import { SalesCharts } from "@/components/SalesCharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  Building2,
  Download,
  ArrowLeft,
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from "date-fns";
import { useLocation } from "wouter";

export default function SalesReports() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState("6months");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: bookings = [] } = trpc.bookings.list.useQuery();
  const { data: halls = [] } = trpc.banquetHalls.list.useQuery();
  const unreadCountQuery = trpc.notifications.unreadCount.useQuery();

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const today = new Date();
    const monthsBack = timeRange === "3months" ? 3 : timeRange === "6months" ? 6 : 12;
    const startDate = startOfMonth(subMonths(today, monthsBack - 1));

    const filteredBookings = bookings.filter((b) => {
      const createdAt = new Date(b.createdAt);
      return createdAt >= startDate;
    });

    // Total metrics
    const totalBookings = filteredBookings.length;
    const confirmedBookings = filteredBookings.filter((b) => b.status === "confirmed").length;
    const softReservations = filteredBookings.filter(
      (b) => (b.status as string) === "soft_reservation" || (b.status as string) === "soft reservation"
    ).length;
    const completedBookings = filteredBookings.filter((b) => b.status === "completed").length;
    const cancelledBookings = filteredBookings.filter((b) => b.status === "cancelled").length;

    // Revenue metrics
    const totalRevenue = filteredBookings.reduce(
      (sum, b) => sum + parseFloat(b.totalAmount || "0"),
      0
    );
    const collectedRevenue = filteredBookings.reduce(
      (sum, b) => sum + parseFloat(b.paidAmount || "0"),
      0
    );
    const pendingRevenue = totalRevenue - collectedRevenue;

    // Conversion rate
    const conversionRate = totalBookings > 0
      ? ((confirmedBookings + completedBookings) / totalBookings) * 100
      : 0;

    // Average booking value
    const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Hall performance
    const hallPerformance = halls.map((hall) => {
      const hallBookings = filteredBookings.filter((b) => b.banquetHallId === hall.id);
      const hallRevenue = hallBookings.reduce(
        (sum, b) => sum + parseFloat(b.totalAmount || "0"),
        0
      );
      return {
        name: hall.name,
        bookings: hallBookings.length,
        revenue: hallRevenue,
        utilization: hallBookings.length > 0 ? (hallBookings.length / totalBookings) * 100 : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Top clients
    const clientMap = new Map<string, { bookings: number; revenue: number }>();
    filteredBookings.forEach((b) => {
      const existing = clientMap.get(b.clientName) || { bookings: 0, revenue: 0 };
      clientMap.set(b.clientName, {
        bookings: existing.bookings + 1,
        revenue: existing.revenue + parseFloat(b.totalAmount || "0"),
      });
    });
    const topClients = Array.from(clientMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Upcoming payments
    const upcomingPayments = bookings
      .filter((b) => {
        const eventDate = new Date(b.eventDate);
        const daysUntil = differenceInDays(eventDate, today);
        const paid = parseFloat(b.paidAmount || "0");
        const total = parseFloat(b.totalAmount || "0");
        return daysUntil > 0 && daysUntil <= 30 && paid < total && b.status !== "cancelled";
      })
      .map((b) => ({
        ...b,
        daysUntil: differenceInDays(new Date(b.eventDate), today),
        pending: parseFloat(b.totalAmount || "0") - parseFloat(b.paidAmount || "0"),
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil);

    // Compare with previous period
    const prevStartDate = subMonths(startDate, monthsBack);
    const prevEndDate = subMonths(startDate, 1);
    const prevBookings = bookings.filter((b) => {
      const createdAt = new Date(b.createdAt);
      return isWithinInterval(createdAt, { start: prevStartDate, end: prevEndDate });
    });
    const prevRevenue = prevBookings.reduce(
      (sum, b) => sum + parseFloat(b.totalAmount || "0"),
      0
    );
    const revenueGrowth = prevRevenue > 0
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
      : 0;
    const bookingsGrowth = prevBookings.length > 0
      ? ((totalBookings - prevBookings.length) / prevBookings.length) * 100
      : 0;

    return {
      totalBookings,
      confirmedBookings,
      softReservations,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      collectedRevenue,
      pendingRevenue,
      conversionRate,
      avgBookingValue,
      hallPerformance,
      topClients,
      upcomingPayments,
      revenueGrowth,
      bookingsGrowth,
    };
  }, [bookings, halls, timeRange]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `PKR ${(amount / 1000000).toFixed(2)}M`;
    }
    return `PKR ${amount.toLocaleString()}`;
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        onNotificationsClick={() => setNotificationOpen(true)}
        onSearchClick={() => setSearchOpen(true)}
        unreadCount={unreadCountQuery.data || 0}
      />

      <NotificationPanel
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />

      <AdvancedSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/sales")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
              <p className="text-gray-500">Comprehensive analytics and insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
                  <div className={`flex items-center text-xs mt-1 ${analytics.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {analytics.revenueGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(analytics.revenueGrowth).toFixed(1)}% vs previous period
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Bookings</p>
                  <p className="text-2xl font-bold">{analytics.totalBookings}</p>
                  <div className={`flex items-center text-xs mt-1 ${analytics.bookingsGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {analytics.bookingsGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(analytics.bookingsGrowth).toFixed(1)}% vs previous period
                  </div>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Conversion Rate</p>
                  <p className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {analytics.confirmedBookings} confirmed of {analytics.totalBookings}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg. Booking Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.avgBookingValue)}</p>
                  <p className="text-xs text-gray-400 mt-1">Per booking average</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <SalesCharts bookings={bookings} />

        {/* Detailed Tables */}
        <Tabs defaultValue="halls" className="space-y-4">
          <TabsList>
            <TabsTrigger value="halls">Hall Performance</TabsTrigger>
            <TabsTrigger value="clients">Top Clients</TabsTrigger>
            <TabsTrigger value="payments">Upcoming Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="halls">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hall Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hall Name</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.hallPerformance.map((hall) => (
                      <TableRow key={hall.name}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {hall.name || "Unassigned"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{hall.bookings}</TableCell>
                        <TableCell className="text-right">{formatCurrency(hall.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{hall.utilization.toFixed(1)}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Clients by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.topClients.map((client, idx) => (
                      <TableRow key={client.name}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            {client.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{client.bookings}</TableCell>
                        <TableCell className="text-right">{formatCurrency(client.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upcoming Payment Follow-ups</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Event Date</TableHead>
                      <TableHead className="text-right">Days Until</TableHead>
                      <TableHead className="text-right">Pending Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.upcomingPayments.slice(0, 10).map((payment) => (
                      <TableRow
                        key={payment.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setLocation(`/booking/${payment.id}`)}
                      >
                        <TableCell className="font-medium">{payment.clientName}</TableCell>
                        <TableCell>{format(new Date(payment.eventDate), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={payment.daysUntil <= 7 ? "destructive" : payment.daysUntil <= 14 ? "default" : "outline"}
                          >
                            {payment.daysUntil} days
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-orange-600 font-medium">
                          {formatCurrency(payment.pending)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
