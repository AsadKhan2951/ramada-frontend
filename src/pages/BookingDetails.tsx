import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Calendar, Loader2, MessageSquare, Activity, DollarSign, CheckCircle2, Users } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { EditBookingDialog } from "@/components/EditBookingDialog";

export default function BookingDetails({ params }: { params: { id: string } }) {
  const bookingId = params.id;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentStage, setPaymentStage] = useState(2); // Default to stage 2
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const { data: booking, isLoading, refetch } = trpc.bookings.getById.useQuery({ id: bookingId });
  const { data: staffMembers } = trpc.staff.list.useQuery();
  const { data: comments, refetch: refetchComments } = trpc.bookingComments.list.useQuery({ bookingId });
  const { data: activityLog } = trpc.activityLog.list.useQuery({ bookingId });
  const { data: customFoodItems } = trpc.customFoodItems.list.useQuery({ bookingId });

  const addCommentMutation = trpc.bookingComments.add.useMutation({
    onSuccess: () => {
      toast.success("Comment added successfully");
      setNewComment("");
      refetchComments();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add comment");
    },
  });

  const confirmBookingMutation = trpc.bookings.confirmBooking.useMutation({
    onSuccess: () => {
      toast.success("Booking confirmed successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to confirm booking");
    },
  });

  const addPaymentMutation = trpc.bookings.addPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment recorded successfully!");
      setPaymentAmount("");
      setPaymentMethod("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record payment");
    },
  });

  const assignAgentMutation = trpc.bookings.assignAgent.useMutation({
    onSuccess: () => {
      toast.success("Booking assigned to sales agent successfully!");
      setSelectedAgent(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign booking");
    },
  });

  const handleAssignAgent = () => {
    if (!selectedAgent) {
      toast.error("Please select a sales agent");
      return;
    }
    assignAgentMutation.mutate({
      bookingId,
      staffId: selectedAgent,
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    addCommentMutation.mutate({
      bookingId,
      comment: newComment,
    });
  };

  const handleConfirmBooking = () => {
    if (!paymentAmount) {
      toast.error("Please enter token payment amount");
      return;
    }
    confirmBookingMutation.mutate({
      bookingId,
      tokenAmount: paymentAmount,
      paymentMethod: paymentMethod || undefined,
    });
  };

  const handleAddPayment = () => {
    if (!paymentAmount) {
      toast.error("Please enter payment amount");
      return;
    }
    
    // Map payment stage to payment type
    const paymentTypeMap: Record<number, "token" | "second_payment" | "final_payment"> = {
      1: "token",
      2: "second_payment",
      3: "final_payment",
    };
    
    addPaymentMutation.mutate({
      bookingId,
      amount: paymentAmount,
      paymentType: paymentTypeMap[paymentStage],
      paymentStage,
      paymentMethod: paymentMethod || undefined,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout title="Not Found">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Booking not found</p>
            <Button onClick={() => setLocation("/sales")} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const statusColors: Record<string, string> = {
    tentative_block: "bg-purple-100 text-purple-800",
    soft_reservation: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <DashboardLayout
      title={`Booking #${booking.bookingNumber}`}
      navItems={[
        { label: "Back to Dashboard", href: "/sales", icon: Calendar },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Booking Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Booking #{booking.bookingNumber}</CardTitle>
                <CardDescription>Created on {format(new Date(booking.createdAt), "PPP")}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                >
                  Edit Booking
                </Button>
                <Badge className={statusColors[booking.status]}>
                  {booking.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Client Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {booking.clientName}</p>
                  <p><strong>Phone:</strong> {booking.clientPhone}</p>
                  {booking.clientEmail && <p><strong>Email:</strong> {booking.clientEmail}</p>}
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Event Details</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Date:</strong> {format(new Date(booking.eventDate), "PPP")}</p>
                  {booking.eventType && <p><strong>Type:</strong> {booking.eventType}</p>}
                  <p><strong>Guests:</strong> {booking.numberOfGuests}</p>
                  <p><strong>Hall:</strong> {booking.hall?.name}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">PKR {parseFloat(booking.totalAmount).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">PKR {parseFloat(booking.paidAmount).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Balance Due</p>
                <p className="text-2xl font-bold text-red-600">
                  PKR {(parseFloat(booking.totalAmount) - parseFloat(booking.paidAmount)).toLocaleString()}
                </p>
              </div>
            </div>

            {booking.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{booking.notes}</p>
                </div>
              </>
            )}
            
            {/* Food Menus Section */}
            {booking.menus && booking.menus.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-4">Food Menus</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {booking.menus.map((menu: any) => (
                      <div key={menu.id} className="p-4 border rounded-lg bg-muted/30">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">{menu.name}</h4>
                            {menu.description && (
                              <p className="text-sm text-muted-foreground mt-1">{menu.description}</p>
                            )}
                          </div>
                          <Badge variant="outline">Menu</Badge>
                        </div>
                        <div className="mt-3 space-y-1 text-sm">
                          <p><strong>Price per person:</strong> PKR {parseFloat(menu.pricePerPerson).toLocaleString()}</p>
                          <p><strong>Total for {booking.numberOfGuests} guests:</strong> PKR {(parseFloat(menu.pricePerPerson) * booking.numberOfGuests).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Additional Services Section */}
            {booking.services && booking.services.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-4">Additional Services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {booking.services.map((service: any) => (
                      <div key={service.id} className="p-4 border rounded-lg bg-muted/30">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{service.name}</h4>
                          <Badge variant="outline">Service</Badge>
                        </div>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                        )}
                        <p className="text-lg font-semibold text-primary">PKR {parseFloat(service.price).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Custom Food Items */}
        {customFoodItems && customFoodItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Custom Food Items</CardTitle>
              <CardDescription>Special requests added to this booking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {customFoodItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-muted rounded-md">
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                      <p className="text-sm">Quantity: {item.quantity}</p>
                    </div>
                    {item.totalPrice && (
                      <p className="font-semibold">PKR {parseFloat(item.totalPrice).toLocaleString()}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


        {/* Selected Menus */}
        {booking.menus && booking.menus.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Food Menus</CardTitle>
              <CardDescription>Catering options for this event</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {booking.menus.map((menu: any) => (
                  <div key={menu.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{menu.menuDetails?.name}</h4>
                        {menu.menuDetails?.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {menu.menuDetails.description}
                          </p>
                        )}
                      </div>
                      {menu.isLocked && (
                        <Badge variant="outline" className="bg-green-50">Locked</Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-sm mt-3">
                      <span className="text-muted-foreground">
                        {menu.numberOfPeople} people × PKR {parseFloat(menu.menuDetails?.pricePerPerson || 0).toLocaleString()}
                      </span>
                      <span className="font-semibold">
                        PKR {parseFloat(menu.totalPrice).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Services */}
        {booking.services && booking.services.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Services</CardTitle>
              <CardDescription>Extra services added to this booking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {booking.services.map((service: any) => (
                  <div key={service.id} className="flex justify-between items-center p-3 bg-muted rounded-md">
                    <div>
                      <p className="font-medium">{service.serviceDetails?.name}</p>
                      {service.serviceDetails?.description && (
                        <p className="text-sm text-muted-foreground">
                          {service.serviceDetails.description}
                        </p>
                      )}
                      <p className="text-sm">Quantity: {service.quantity}</p>
                    </div>
                    <p className="font-semibold">
                      PKR {parseFloat(service.totalPrice).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assign to Sales Agent - Only for admins and full access users */}
        {(user?.role === 'admin' || user?.accessLevel === 'full') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assign to Sales Agent
              </CardTitle>
              <CardDescription>Assign this booking to a sales team member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="salesAgent">Select Sales Agent</Label>
                  <select
                    id="salesAgent"
                    value={selectedAgent || ''}
                      onChange={(e) => setSelectedAgent(e.target.value || null)}
                    className="w-full mt-1 p-2 border rounded-md bg-background"
                  >
                    <option value="">Select an agent...</option>
                    {staffMembers?.filter((s: any) => s.department === 'sales').map((staff: any) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} - {staff.jobTitle}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handleAssignAgent}
                  disabled={assignAgentMutation.isPending || !selectedAgent}
                  className="mt-6"
                >
                  {assignAgentMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Assigning...</>
                  ) : (
                    'Assign'
                  )}
                </Button>
              </div>
              {booking.assignedTo && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Currently assigned to:</p>
                  <p className="font-medium">
                    {staffMembers?.find((s: any) => s.id === booking.assignedTo)?.name || `Staff ID: ${booking.assignedTo}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments
              </CardTitle>
              <CardDescription>Inter-department communication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments && comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-muted rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{comment.userName || comment.userEmail}</p>
                        <Badge variant="outline" className="text-xs">
                          {comment.department}
                        </Badge>
                      </div>
                      <p className="text-sm">{comment.comment}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "PPp")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="newComment">Add Comment</Label>
                <Textarea
                  id="newComment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your comment here..."
                  rows={3}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={addCommentMutation.isPending || !newComment.trim()}
                  size="sm"
                  className="w-full"
                >
                  {addCommentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add Comment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Log
              </CardTitle>
              <CardDescription>Complete history of changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activityLog && activityLog.length > 0 ? (
                  activityLog.map((log) => (
                    <div key={log.id} className="flex gap-3 pb-3 border-b last:border-0">
                      <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{log.description}</p>
                        <p className="text-xs text-muted-foreground">
                          by {log.userName || log.userEmail} • {format(new Date(log.createdAt), "PPp")}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        {booking.status === "soft_reservation" && user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Confirm Booking
              </CardTitle>
              <CardDescription>Record token payment to confirm this reservation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenAmount">Token Amount (PKR) *</Label>
                  <Input
                    id="tokenAmount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter token amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Input
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="Cash, Bank Transfer, etc."
                  />
                </div>
              </div>
              <Button
                onClick={handleConfirmBooking}
                disabled={confirmBookingMutation.isPending || !paymentAmount}
                className="w-full"
              >
                {confirmBookingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm Booking
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {booking.status === "confirmed" && user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Tracking (3-Stage System)
              </CardTitle>
              <CardDescription>
                Track payments across three milestones: Token, 50% (20 days before), 50% Final (7 days before)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Progress */}
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Payment Progress</span>
                  <span className="font-semibold">
                    PKR {parseFloat(booking.paidAmount).toLocaleString()} / PKR {parseFloat(booking.totalAmount).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{
                      width: `${(parseFloat(booking.paidAmount) / parseFloat(booking.totalAmount)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Payment Stages */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stage 1: Token */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${booking.payments?.some((p: any) => p.paymentStage === 1) ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <h4 className="font-semibold text-sm">Stage 1: Token</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Initial booking confirmation</p>
                  {booking.payments?.find((p: any) => p.paymentStage === 1) ? (
                    <p className="text-sm font-semibold text-green-600">
                      ✓ PKR {parseFloat(booking.payments?.find((p: any) => p.paymentStage === 1)?.amount || '0').toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Pending</p>
                  )}
                </div>

                {/* Stage 2: 50% (20 days before) */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${booking.payments?.some((p: any) => p.paymentStage === 2) ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <h4 className="font-semibold text-sm">Stage 2: 50%</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Due 20 days before event</p>
                  {booking.payments?.find((p: any) => p.paymentStage === 2) ? (
                    <p className="text-sm font-semibold text-green-600">
                      ✓ PKR {parseFloat(booking.payments?.find((p: any) => p.paymentStage === 2)?.amount || '0').toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      PKR {(parseFloat(booking.totalAmount) * 0.5).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Stage 3: 50% Final (7 days before) */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${booking.payments?.some((p: any) => p.paymentStage === 3) ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <h4 className="font-semibold text-sm">Stage 3: Final 50%</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Due 7 days before event</p>
                  {booking.payments?.find((p: any) => p.paymentStage === 3) ? (
                    <p className="text-sm font-semibold text-green-600">
                      ✓ PKR {parseFloat(booking.payments?.find((p: any) => p.paymentStage === 3)?.amount || '0').toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      PKR {(parseFloat(booking.totalAmount) * 0.5).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Record New Payment */}
              <div className="space-y-4">
                <h4 className="font-semibold">Record Payment</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentAmount">Amount (PKR)</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      placeholder="Enter amount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentStage">Payment Stage</Label>
                    <select
                      id="paymentStage"
                      className="w-full px-3 py-2 border rounded-md"
                      value={paymentStage}
                      onChange={(e) => setPaymentStage(parseInt(e.target.value))}
                    >
                      <option value="1">Stage 1: Token</option>
                      <option value="2">Stage 2: 50% (20 days before)</option>
                      <option value="3">Stage 3: Final 50% (7 days before)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Input
                      id="paymentMethod"
                      placeholder="e.g., Cash, Bank Transfer"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddPayment}
                  disabled={!paymentAmount || addPaymentMutation.isPending}
                >
                  {addPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Booking Dialog */}
      {booking && (
        <EditBookingDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          booking={booking}
          onSuccess={() => refetch()}
        />
      )}
    </DashboardLayout>
  );
}
