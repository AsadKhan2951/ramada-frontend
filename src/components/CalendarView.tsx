import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus, StickyNote, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function CalendarView() {
  const [, setLocation] = useLocation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<any[]>([]);

  // Calculate calendar range
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Fetch bookings for the month
  const { data: bookings, isLoading: bookingsLoading } = trpc.calendar.getBookings.useQuery({
    startDate: monthStart,
    endDate: monthEnd,
  });

  // Fetch date notes
  const { data: notes, refetch: refetchNotes } = trpc.dateNotes.list.useQuery({
    startDate: monthStart,
    endDate: monthEnd,
  });

  const createNoteMutation = trpc.dateNotes.create.useMutation({
    onSuccess: () => {
      toast.success("Note added successfully");
      setShowNoteDialog(false);
      setNoteText("");
      setIsPrivateNote(false);
      refetchNotes();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add note");
    },
  });

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const getBookingsForDate = (date: Date) => {
    if (!bookings) return [];
    return bookings.filter((booking) =>
      isSameDay(new Date(booking.eventDate), date)
    );
  };

  const getNotesForDate = (date: Date) => {
    if (!notes) return [];
    return notes.filter((note) =>
      isSameDay(new Date(note.date), date)
    );
  };

  const handleDateClick = (date: Date) => {
    const dateBookings = getBookingsForDate(date);
    if (dateBookings.length > 0) {
      setSelectedDate(date);
      setSelectedBookings(dateBookings);
    }
  };

  const handleAddNote = (date: Date) => {
    setSelectedDate(date);
    setShowNoteDialog(true);
  };

  const handleSaveNote = () => {
    if (!selectedDate || !noteText.trim()) {
      toast.error("Please enter a note");
      return;
    }
    createNoteMutation.mutate({
      date: selectedDate,
      note: noteText,
      isPrivate: isPrivateNote,
    });
  };

  const statusColors = {
    soft_reservation: "bg-yellow-100 text-yellow-800 border-yellow-300",
    confirmed: "bg-green-100 text-green-800 border-green-300",
    completed: "bg-gray-100 text-gray-800 border-gray-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
  };

  if (bookingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-semibold text-sm p-2 text-muted-foreground">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const dayBookings = getBookingsForDate(day);
              const dayNotes = getNotesForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border rounded-lg p-2 relative group ${
                    isCurrentMonth ? "bg-background" : "bg-muted/30"
                  } ${isToday ? "ring-2 ring-primary" : ""} hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer`}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                    } ${isToday ? "text-primary font-bold" : ""}`}>
                      {format(day, "d")}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddNote(day);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Bookings */}
                  <div className="space-y-1">
                    {dayBookings.slice(0, 2).map((booking) => (
                      <div
                        key={booking.id}
                        className={`text-xs p-1 rounded border ${
                          statusColors[booking.status as keyof typeof statusColors]
                        } truncate cursor-pointer hover:opacity-80`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/booking/${booking.id}`);
                        }}
                      >
                        {booking.hallName} - {booking.clientName}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-xs text-muted-foreground font-medium">
                        +{dayBookings.length - 2} more
                      </div>
                    )}
                  </div>

                  {/* Animated Sticky Note Indicator */}
                  {dayNotes.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(day);
                        setShowNoteDialog(true);
                        setNoteText(dayNotes[0]?.note || "");
                        setIsPrivateNote(dayNotes[0]?.isPrivate || false);
                      }}
                      className="absolute bottom-2 right-2 group-hover:scale-110 transition-transform cursor-pointer"
                    >
                      <div className="relative">
                        <StickyNote 
                          className="h-6 w-6 text-yellow-500 fill-yellow-100 animate-pulse" 
                          style={{ 
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                          }}
                        />
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                          {dayNotes.length}
                        </span>
                        {/* Note preview on hover */}
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10 w-48">
                          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-2 shadow-lg">
                            <p className="text-xs font-semibold text-yellow-900 mb-1">Notes:</p>
                            {dayNotes.slice(0, 2).map((note, idx) => (
                              <p key={idx} className="text-xs text-yellow-800 truncate">
                                • {note.note}
                              </p>
                            ))}
                            {dayNotes.length > 2 && (
                              <p className="text-xs text-yellow-700 font-medium mt-1">
                                +{dayNotes.length - 2} more
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Bookings Dialog */}
      {selectedDate && selectedBookings.length > 0 && (
        <Dialog open={selectedBookings.length > 0} onOpenChange={() => setSelectedBookings([])}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bookings on {format(selectedDate, "PPP")}</DialogTitle>
              <DialogDescription>
                {selectedBookings.length} booking(s) scheduled for this date
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {selectedBookings.map((booking) => (
                <Card key={booking.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setLocation(`/booking/${booking.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">{booking.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.hallName} • {booking.numberOfGuests} guests
                        </p>
                        {booking.eventType && (
                          <p className="text-sm text-muted-foreground">{booking.eventType}</p>
                        )}
                      </div>
                      <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                        {booking.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note for {selectedDate && format(selectedDate, "PPP")}</DialogTitle>
            <DialogDescription>
              Add a reminder or special note for this date
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Enter your note here..."
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="private"
                checked={isPrivateNote}
                onCheckedChange={setIsPrivateNote}
              />
              <Label htmlFor="private">Private (only visible to me)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} disabled={createNoteMutation.isPending}>
              {createNoteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Note"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
              <span className="text-sm">Soft Reservation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
              <span className="text-sm">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
              <span className="text-sm">Cancelled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
