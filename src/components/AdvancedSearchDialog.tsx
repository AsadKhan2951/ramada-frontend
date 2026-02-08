import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Search, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useLocation } from "wouter";

interface AdvancedSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

interface SearchFilters {
  query: string;
  status: string;
  hallId: string;
  paymentStage: string;
  minGuests: string;
  maxGuests: string;
  minAmount: string;
  maxAmount: string;
  eventDateFrom: Date | undefined;
  eventDateTo: Date | undefined;
}

export function AdvancedSearchDialog({
  open,
  onClose,
}: AdvancedSearchDialogProps) {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    status: "all",
    hallId: "all",
    paymentStage: "all",
    minGuests: "",
    maxGuests: "",
    minAmount: "",
    maxAmount: "",
    eventDateFrom: undefined,
    eventDateTo: undefined,
  });

  const { data: halls = [] } = trpc.banquetHalls.list.useQuery();
  const { data: allBookings = [] } = trpc.bookings.list.useQuery();

  // Filter bookings based on search criteria
  const filteredBookings = allBookings.filter((booking) => {
    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      const matchesQuery =
        booking.bookingNumber.toLowerCase().includes(query) ||
        booking.clientName.toLowerCase().includes(query) ||
        booking.clientPhone?.toLowerCase().includes(query) ||
        booking.eventType?.toLowerCase().includes(query);
      if (!matchesQuery) return false;
    }

    // Status filter
    if (filters.status !== "all" && booking.status !== filters.status) {
      return false;
    }

    // Hall filter
    if (
      filters.hallId !== "all" &&
      booking.banquetHallId !== filters.hallId
    ) {
      return false;
    }

    // Guest count range
    if (filters.minGuests && booking.numberOfGuests < parseInt(filters.minGuests)) {
      return false;
    }
    if (filters.maxGuests && booking.numberOfGuests > parseInt(filters.maxGuests)) {
      return false;
    }

    // Amount range
    if (
      filters.minAmount &&
      parseFloat(booking.totalAmount) < parseFloat(filters.minAmount)
    ) {
      return false;
    }
    if (
      filters.maxAmount &&
      parseFloat(booking.totalAmount) > parseFloat(filters.maxAmount)
    ) {
      return false;
    }

    // Event date range
    if (filters.eventDateFrom) {
      const eventDate = new Date(booking.eventDate);
      if (eventDate < filters.eventDateFrom) {
        return false;
      }
    }
    if (filters.eventDateTo) {
      const eventDate = new Date(booking.eventDate);
      if (eventDate > filters.eventDateTo) {
        return false;
      }
    }

    return true;
  });

  const handleClearFilters = () => {
    setFilters({
      query: "",
      status: "all",
      hallId: "all",
      paymentStage: "all",
      minGuests: "",
      maxGuests: "",
      minAmount: "",
      maxAmount: "",
      eventDateFrom: undefined,
      eventDateTo: undefined,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.status !== "all") count++;
    if (filters.hallId !== "all") count++;
    if (filters.paymentStage !== "all") count++;
    if (filters.minGuests || filters.maxGuests) count++;
    if (filters.minAmount || filters.maxAmount) count++;
    if (filters.eventDateFrom || filters.eventDateTo) count++;
    return count;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "soft reservation":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </DialogTitle>
          <DialogDescription>
            Use filters to find specific bookings quickly
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Text Search */}
          <div className="col-span-full">
            <Label htmlFor="query">Search</Label>
            <Input
              id="query"
              placeholder="Booking number, client name, phone, or event type..."
              value={filters.query}
              onChange={(e) =>
                setFilters({ ...filters, query: e.target.value })
              }
              className="mt-1.5"
            />
          </div>

          {/* Status Filter */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value })
              }
            >
              <SelectTrigger id="status" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="soft reservation">Soft Reservation</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hall Filter */}
          <div>
            <Label htmlFor="hall">Banquet Hall</Label>
            <Select
              value={filters.hallId}
              onValueChange={(value) =>
                setFilters({ ...filters, hallId: value })
              }
            >
              <SelectTrigger id="hall" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Halls</SelectItem>
                {halls.map((hall) => (
                  <SelectItem key={hall.id} value={hall.id.toString()}>
                    {hall.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Stage Filter */}
          <div>
            <Label htmlFor="paymentStage">Payment Stage</Label>
            <Select
              value={filters.paymentStage}
              onValueChange={(value) =>
                setFilters({ ...filters, paymentStage: value })
              }
            >
              <SelectTrigger id="paymentStage" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="token">Token Only</SelectItem>
                <SelectItem value="partial">Partially Paid</SelectItem>
                <SelectItem value="full">Fully Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Guest Count Range */}
          <div>
            <Label>Guest Count Range</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minGuests}
                onChange={(e) =>
                  setFilters({ ...filters, minGuests: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxGuests}
                onChange={(e) =>
                  setFilters({ ...filters, maxGuests: e.target.value })
                }
              />
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <Label>Amount Range (PKR)</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minAmount}
                onChange={(e) =>
                  setFilters({ ...filters, minAmount: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxAmount}
                onChange={(e) =>
                  setFilters({ ...filters, maxAmount: e.target.value })
                }
              />
            </div>
          </div>

          {/* Event Date Range */}
          <div className="col-span-full">
            <Label>Event Date Range</Label>
            <div className="flex gap-2 mt-1.5">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.eventDateFrom
                      ? format(filters.eventDateFrom, "PPP")
                      : "From date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.eventDateFrom}
                    onSelect={(date) =>
                      setFilters({ ...filters, eventDateFrom: date })
                    }
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.eventDateTo
                      ? format(filters.eventDateTo, "PPP")
                      : "To date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.eventDateTo}
                    onSelect={(date) =>
                      setFilters({ ...filters, eventDateTo: date })
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {getActiveFilterCount() > 0 && (
          <div className="flex items-center gap-2 pb-3 border-b">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {getActiveFilterCount()} active filter
              {getActiveFilterCount() > 1 ? "s" : ""}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">
              {filteredBookings.length} result{filteredBookings.length !== 1 ? "s" : ""}
            </h3>
          </div>
          <ScrollArea className="h-[300px]">
            {filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Search className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No bookings match your search criteria
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-lg border p-4 hover:bg-accent/20 cursor-pointer transition-colors"
                    onClick={() => {
                      setLocation(`/booking/${booking.id}`);
                      onClose();
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{booking.clientName}</h4>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusBadgeColor(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.bookingNumber}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>
                            {format(new Date(booking.eventDate), "PPP")}
                          </span>
                          <span>•</span>
                          <span>{booking.numberOfGuests} guests</span>
                          <span>•</span>
                          <span>PKR {parseFloat(booking.totalAmount).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
