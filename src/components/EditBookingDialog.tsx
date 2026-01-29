import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EditBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  onSuccess: () => void;
}

export function EditBookingDialog({ open, onOpenChange, booking, onSuccess }: EditBookingDialogProps) {
  const [clientName, setClientName] = useState(booking.clientName);
  const [clientPhone, setClientPhone] = useState(booking.clientPhone);
  const [clientEmail, setClientEmail] = useState(booking.clientEmail || "");
  const [eventDate, setEventDate] = useState(
    new Date(booking.eventDate).toISOString().split("T")[0]
  );
  const [eventType, setEventType] = useState(booking.eventType || "");
  const [numberOfGuests, setNumberOfGuests] = useState(booking.numberOfGuests);
  const [notes, setNotes] = useState(booking.notes || "");

  const updateBooking = trpc.bookings.updateBooking.useMutation({
    onSuccess: () => {
      toast.success("Booking updated successfully");
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update booking");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateBooking.mutate({
      bookingId: booking.id,
      clientName,
      clientPhone,
      clientEmail: clientEmail || undefined,
      eventDate: new Date(eventDate),
      eventType: eventType || undefined,
      numberOfGuests: parseInt(numberOfGuests.toString()),
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Update booking information. All changes will be logged in the activity history.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientPhone">Client Phone *</Label>
              <Input
                id="clientPhone"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date *</Label>
              <Input
                id="eventDate"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Input
                id="eventType"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="e.g., Wedding, Conference"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfGuests">Number of Guests *</Label>
              <Input
                id="numberOfGuests"
                type="number"
                value={numberOfGuests}
                onChange={(e) => setNumberOfGuests(parseInt(e.target.value))}
                required
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes or special requests"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateBooking.isPending}>
              {updateBooking.isPending ? "Updating..." : "Update Booking"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
