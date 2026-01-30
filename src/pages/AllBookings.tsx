import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardHeader } from "@/components/DashboardHeader";
import { NotificationPanel } from "@/components/NotificationPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { trpc } from "@/lib/trpc";
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  Plus,
  LayoutGrid,
  BarChart3,
  List,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 20;

export default function AllBookings() {
  const [, setLocation] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hallFilter, setHallFilter] = useState<string>("all");
  const [paymentStageFilter, setPaymentStageFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // Sorting
  const [sortField, setSortField] = useState<string>("eventDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { data: bookings, isLoading } = trpc.bookings.list.useQuery();
  const { data: halls } = trpc.banquetHalls.list.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];

    let filtered = [...bookings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.clientName.toLowerCase().includes(query) ||
          b.bookingNumber.toLowerCase().includes(query) ||
          b.clientPhone.includes(query) ||
          (b.clientEmail && b.clientEmail.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Hall filter
    if (hallFilter !== "all") {
      filtered = filtered.filter((b) => b.banquetHallId.toString() === hallFilter);
    }

    // Payment stage filter
    if (paymentStageFilter !== "all") {
      filtered = filtered.filter((b) => {
        const paidPercentage = (parseFloat(b.paidAmount || "0") / parseFloat(b.totalAmount || "1")) * 100;
        switch (paymentStageFilter) {
          case "unpaid":
            return paidPercentage === 0;
          case "partial":
            return paidPercentage > 0 && paidPercentage < 100;
          case "paid":
            return paidPercentage >= 100;
          default:
            return true;
        }
      });
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((b) => new Date(b.eventDate) >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((b) => new Date(b.eventDate) <= dateTo);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "eventDate":
          aVal = new Date(a.eventDate).getTime();
          bVal = new Date(b.eventDate).getTime();
          break;
        case "clientName":
          aVal = a.clientName.toLowerCase();
          bVal = b.clientName.toLowerCase();
          break;
        case "totalAmount":
          aVal = parseFloat(a.totalAmount || "0");
          bVal = parseFloat(b.totalAmount || "0");
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "createdAt":
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        default:
          aVal = a[sortField as keyof typeof a];
          bVal = b[sortField as keyof typeof b];
      }
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [bookings, searchQuery, statusFilter, hallFilter, paymentStageFilter, dateFrom, dateTo, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, hallFilter, paymentStageFilter, dateFrom, dateTo]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setHallFilter("all");
    setPaymentStageFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const activeFilterCount = [
    statusFilter !== "all",
    hallFilter !== "all",
    paymentStageFilter !== "all",
    dateFrom !== undefined,
    dateTo !== undefined,
  ].filter(Boolean).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "soft_reservation":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getPaymentStatus = (booking: any) => {
    const paid = parseFloat(booking.paidAmount || "0");
    const total = parseFloat(booking.totalAmount || "1");
    const percentage = (paid / total) * 100;
    
    if (percentage >= 100) return { label: "Fully Paid", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" };
    if (percentage > 0) return { label: `${percentage.toFixed(0)}% Paid`, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" };
    return { label: "Unpaid", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
  };

  const navItems = [
    { label: "Dashboard", href: "/sales", icon: LayoutGrid },
    { label: "All Bookings", href: "/bookings", icon: List },
    { label: "Create Booking", href: "/booking/create", icon: Plus },
    { label: "Reports", href: "/sales/reports", icon: BarChart3 },
  ];

  return (
    <DashboardLayout title="All Bookings" navItems={navItems}>
      <DashboardHeader
        onSearchClick={() => {}}
        onNotificationsClick={() => setShowNotifications(true)}
        unreadCount={unreadCount}
      />

      <NotificationPanel
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">All Bookings</h1>
            <p className="text-muted-foreground">
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <Button onClick={() => setLocation("/booking/create")}>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, booking number, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 pt-4 border-t">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="soft_reservation">Soft Reservation</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Hall Filter */}
                <div className="space-y-2">
                  <Label>Hall</Label>
                  <Select value={hallFilter} onValueChange={setHallFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Halls" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Halls</SelectItem>
                      {halls?.map((hall) => (
                        <SelectItem key={hall.id} value={hall.id.toString()}>
                          {hall.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Stage Filter */}
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select value={paymentStageFilter} onValueChange={setPaymentStageFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Payments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partially Paid</SelectItem>
                      <SelectItem value="paid">Fully Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From */}
                <div className="space-y-2">
                  <Label>Event Date From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date To */}
                <div className="space-y-2">
                  <Label>Event Date To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("bookingNumber")}
                    >
                      Booking #
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("clientName")}
                    >
                      Client
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("eventDate")}
                    >
                      Event Date
                    </TableHead>
                    <TableHead>Hall</TableHead>
                    <TableHead className="text-center">Guests</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-right"
                      onClick={() => handleSort("totalAmount")}
                    >
                      Amount
                    </TableHead>
                    <TableHead className="text-center">Payment</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("status")}
                    >
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No bookings found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedBookings.map((booking) => {
                      const paymentStatus = getPaymentStatus(booking);
                      return (
                        <TableRow
                          key={booking.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setLocation(`/booking/${booking.id}`)}
                        >
                          <TableCell className="font-medium">
                            {booking.bookingNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{booking.clientName}</div>
                              <div className="text-xs text-muted-foreground">
                                {booking.clientPhone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(booking.eventDate), "PPP")}
                          </TableCell>
                          <TableCell>
                            {halls?.find(h => h.id === booking.banquetHallId)?.name || "N/A"}
                          </TableCell>
                          <TableCell className="text-center">
                            {booking.numberOfGuests}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            PKR {parseFloat(booking.totalAmount).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={paymentStatus.color}>
                              {paymentStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} of{" "}
                  {filteredBookings.length} bookings
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
