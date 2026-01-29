import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { 
  BarChart3, 
  Building2, 
  Calendar, 
  DollarSign, 
  Loader2, 
  TrendingUp, 
  Users, 
  UtensilsCrossed,
  Sparkles,
  Wine,
  Package
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AdminReports() {
  const [timeRange, setTimeRange] = useState("6");
  
  const { data: bookings, isLoading: bookingsLoading } = trpc.bookings.list.useQuery();
  const { data: halls } = trpc.banquetHalls.list.useQuery();
  const { data: menus } = trpc.foodMenus.list.useQuery();
  const { data: services } = trpc.additionalServices.list.useQuery();

  // Calculate date range
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - parseInt(timeRange));
    return { start, end };
  }, [timeRange]);

  // Filter bookings by date range
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter(b => {
      const eventDate = new Date(b.eventDate);
      return eventDate >= dateRange.start && eventDate <= dateRange.end;
    });
  }, [bookings, dateRange]);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const confirmed = filteredBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const totalRevenue = confirmed.reduce((sum, b) => sum + (parseFloat(b.totalAmount || "0") || 0), 0);
    const totalGuests = confirmed.reduce((sum, b) => sum + (b.numberOfGuests || 0), 0);
    const avgBookingValue = confirmed.length > 0 ? totalRevenue / confirmed.length : 0;
    
    return {
      totalBookings: filteredBookings.length,
      confirmedBookings: confirmed.length,
      totalRevenue,
      totalGuests,
      avgBookingValue,
      conversionRate: filteredBookings.length > 0 ? (confirmed.length / filteredBookings.length) * 100 : 0,
    };
  }, [filteredBookings]);

  // Hall performance data
  const hallPerformance = useMemo(() => {
    if (!halls || !filteredBookings) return [];
    
    return halls.map(hall => {
      const hallBookings = filteredBookings.filter(b => b.banquetHallId === hall.id);
      const confirmedBookings = hallBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
      const revenue = confirmedBookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount || "0") || 0), 0);
      const guests = confirmedBookings.reduce((sum, b) => sum + (b.numberOfGuests || 0), 0);
      
      return {
        id: hall.id,
        name: hall.name,
        capacity: hall.capacity,
        totalBookings: hallBookings.length,
        confirmedBookings: confirmedBookings.length,
        revenue,
        guests,
        utilizationRate: hallBookings.length > 0 ? (confirmedBookings.length / hallBookings.length) * 100 : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [halls, filteredBookings]);

  // Monthly revenue by category
  const monthlyData = useMemo(() => {
    const months: { [key: string]: { food: number; hall: number; services: number; total: number; guests: number } } = {};
    
    filteredBookings.forEach(booking => {
      if (booking.status !== 'confirmed' && booking.status !== 'completed') return;
      
      const date = new Date(booking.eventDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { food: 0, hall: 0, services: 0, total: 0, guests: 0 };
      }
      
      const total = parseFloat(booking.totalAmount || "0") || 0;
      // Estimate breakdown (in a real app, this would come from actual data)
      months[monthKey].hall += total * 0.4;
      months[monthKey].food += total * 0.45;
      months[monthKey].services += total * 0.15;
      months[monthKey].total += total;
      months[monthKey].guests += booking.numberOfGuests || 0;
    });
    
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        ...data,
      }));
  }, [filteredBookings]);

  // Chart data for revenue breakdown
  const revenueBreakdownData = {
    labels: ['Hall Rental', 'Food & Beverage', 'Additional Services'],
    datasets: [{
      data: [
        monthlyData.reduce((sum, m) => sum + m.hall, 0),
        monthlyData.reduce((sum, m) => sum + m.food, 0),
        monthlyData.reduce((sum, m) => sum + m.services, 0),
      ],
      backgroundColor: ['#1f2937', '#374151', '#6b7280'],
      borderWidth: 0,
    }],
  };

  // Chart data for monthly trends
  const monthlyTrendData = {
    labels: monthlyData.map(m => m.month),
    datasets: [
      {
        label: 'Hall Revenue',
        data: monthlyData.map(m => m.hall),
        backgroundColor: '#1f2937',
        stack: 'revenue',
      },
      {
        label: 'Food Revenue',
        data: monthlyData.map(m => m.food),
        backgroundColor: '#374151',
        stack: 'revenue',
      },
      {
        label: 'Services Revenue',
        data: monthlyData.map(m => m.services),
        backgroundColor: '#6b7280',
        stack: 'revenue',
      },
    ],
  };

  // Guest count trend
  const guestTrendData = {
    labels: monthlyData.map(m => m.month),
    datasets: [{
      label: 'Total Guests',
      data: monthlyData.map(m => m.guests),
      borderColor: '#1f2937',
      backgroundColor: 'rgba(31, 41, 55, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  // Hall utilization chart
  const hallUtilizationData = {
    labels: hallPerformance.slice(0, 6).map(h => h.name),
    datasets: [{
      label: 'Bookings',
      data: hallPerformance.slice(0, 6).map(h => h.confirmedBookings),
      backgroundColor: '#1f2937',
    }],
  };

  if (bookingsLoading) {
    return (
      <DashboardLayout
        title="Admin Reports"
        navItems={[
          { label: "Back to Home", href: "/", icon: Building2 },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Admin Reports"
      navItems={[
        { label: "Dashboard", href: "/", icon: Building2 },
        { label: "Sales Reports", href: "/sales/reports", icon: BarChart3 },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Reports</h1>
            <p className="text-muted-foreground">Comprehensive analytics for food, halls, services, and guests</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total Bookings</span>
              </div>
              <p className="text-2xl font-bold">{metrics.totalBookings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Confirmed</span>
              </div>
              <p className="text-2xl font-bold">{metrics.confirmedBookings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold">PKR {(metrics.totalRevenue / 1000000).toFixed(1)}M</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total Guests</span>
              </div>
              <p className="text-2xl font-bold">{metrics.totalGuests.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Avg Booking</span>
              </div>
              <p className="text-2xl font-bold">PKR {(metrics.avgBookingValue / 1000).toFixed(0)}K</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Conversion</span>
              </div>
              <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(0)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different report sections */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="halls">Halls</TabsTrigger>
            <TabsTrigger value="food">Food & Beverage</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
                  <CardDescription>Distribution by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Doughnut 
                      data={revenueBreakdownData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'bottom' },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Revenue Trend</CardTitle>
                  <CardDescription>Stacked by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Bar 
                      data={monthlyTrendData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: { stacked: true },
                          y: { stacked: true },
                        },
                        plugins: {
                          legend: { position: 'bottom' },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Guest Count Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Guest Count Trend</CardTitle>
                  <CardDescription>Total guests hosted per month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Line 
                      data={guestTrendData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Hall Utilization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hall Utilization</CardTitle>
                  <CardDescription>Bookings by hall</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Bar 
                      data={hallUtilizationData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        plugins: {
                          legend: { display: false },
                        },
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Halls Tab */}
          <TabsContent value="halls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Hall Performance Report
                </CardTitle>
                <CardDescription>Detailed analytics for each banquet hall</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Hall Name</th>
                        <th className="text-center py-3 px-4 font-medium">Capacity</th>
                        <th className="text-center py-3 px-4 font-medium">Total Bookings</th>
                        <th className="text-center py-3 px-4 font-medium">Confirmed</th>
                        <th className="text-center py-3 px-4 font-medium">Guests Hosted</th>
                        <th className="text-right py-3 px-4 font-medium">Revenue</th>
                        <th className="text-center py-3 px-4 font-medium">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hallPerformance.map((hall, index) => (
                        <tr key={hall.id} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                          <td className="py-3 px-4 font-medium">{hall.name}</td>
                          <td className="py-3 px-4 text-center">{hall.capacity}</td>
                          <td className="py-3 px-4 text-center">{hall.totalBookings}</td>
                          <td className="py-3 px-4 text-center">{hall.confirmedBookings}</td>
                          <td className="py-3 px-4 text-center">{hall.guests.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">PKR {hall.revenue.toLocaleString()}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={hall.utilizationRate >= 50 ? "default" : "secondary"}>
                              {hall.utilizationRate.toFixed(0)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t font-bold">
                        <td className="py-3 px-4">Total</td>
                        <td className="py-3 px-4 text-center">-</td>
                        <td className="py-3 px-4 text-center">{hallPerformance.reduce((s, h) => s + h.totalBookings, 0)}</td>
                        <td className="py-3 px-4 text-center">{hallPerformance.reduce((s, h) => s + h.confirmedBookings, 0)}</td>
                        <td className="py-3 px-4 text-center">{hallPerformance.reduce((s, h) => s + h.guests, 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">PKR {hallPerformance.reduce((s, h) => s + h.revenue, 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">-</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Food & Beverage Tab */}
          <TabsContent value="food" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5" />
                  Food & Beverage Report
                </CardTitle>
                <CardDescription>Menu performance and food revenue analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <UtensilsCrossed className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Food Revenue</span>
                    </div>
                    <p className="text-2xl font-bold">
                      PKR {(monthlyData.reduce((s, m) => s + m.food, 0) / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Wine className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Avg Per Guest</span>
                    </div>
                    <p className="text-2xl font-bold">
                      PKR {metrics.totalGuests > 0 ? Math.round(monthlyData.reduce((s, m) => s + m.food, 0) / metrics.totalGuests).toLocaleString() : 0}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Guests Served</span>
                    </div>
                    <p className="text-2xl font-bold">{metrics.totalGuests.toLocaleString()}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <h4 className="font-semibold mb-4">Menu Packages</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Menu Name</th>
                        <th className="text-right py-3 px-4 font-medium">Price/Person</th>
                        <th className="text-center py-3 px-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menus?.map((menu, index) => (
                        <tr key={menu.id} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{menu.name}</p>
                              <p className="text-xs text-muted-foreground">{menu.description}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">PKR {parseFloat(menu.pricePerPerson).toLocaleString()}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={menu.isActive ? "default" : "secondary"}>
                              {menu.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Additional Services Report
                </CardTitle>
                <CardDescription>Service usage and revenue analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Services Revenue</span>
                    </div>
                    <p className="text-2xl font-bold">
                      PKR {(monthlyData.reduce((s, m) => s + m.services, 0) / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Available Services</span>
                    </div>
                    <p className="text-2xl font-bold">{services?.length || 0}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <h4 className="font-semibold mb-4">Service Catalog</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Service Name</th>
                        <th className="text-left py-3 px-4 font-medium">Category</th>
                        <th className="text-right py-3 px-4 font-medium">Price</th>
                        <th className="text-center py-3 px-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services?.map((service, index) => (
                        <tr key={service.id} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-xs text-muted-foreground">{service.description}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="capitalize">{service.category}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">PKR {parseFloat(service.price).toLocaleString()}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={service.isActive ? "default" : "secondary"}>
                              {service.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
