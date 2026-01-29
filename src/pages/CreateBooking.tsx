import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, Loader2, Plus, X, Clock, Users, Building, Truck } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface VenueSelection {
  hallId: string;
  eventTime: string;
  customRate: string;
}

interface CustomMenuItem {
  itemName: string;
  quantity: string;
  price: string;
}

interface CustomServiceItem {
  serviceName: string;
  description: string;
  price: string;
}

interface CustomMenuPackage {
  menuName: string;
  items: string[];
  pricePerPerson: string;
}

export default function CreateBooking() {
  const [, setLocation] = useLocation();
  
  // Multi-venue selection
  const [venues, setVenues] = useState<VenueSelection[]>([{ hallId: "", eventTime: "", customRate: "" }]);
  
  // Event details
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("");
  const [expectedGuests, setExpectedGuests] = useState("");
  const [roomsRequired, setRoomsRequired] = useState("0");
  
  // Client information
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCnic, setClientCnic] = useState("");
  const [clientNtn, setClientNtn] = useState("");
  
  // Booking type
  const [blockType, setBlockType] = useState<"tentative" | "definite">("tentative");
  
  // Notes
  const [notes, setNotes] = useState("");
  
  // Food menu selection
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");
  const [customFoodItems, setCustomFoodItems] = useState<CustomMenuItem[]>([]);
  const [customMenuPackages, setCustomMenuPackages] = useState<CustomMenuPackage[]>([]);
  
  // Additional services
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set());
  const [customServices, setCustomServices] = useState<CustomServiceItem[]>([]);
  
  // Vendor details
  const [vendorDetails, setVendorDetails] = useState({
    vendorName: "",
    vendorContact: "",
    vendorService: "",
    vendorNotes: ""
  });
  
  // Confirmation mode
  const [confirmNow, setConfirmNow] = useState(false);
  const [tokenAmount, setTokenAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isTaxFiler, setIsTaxFiler] = useState(true);

  const { data: halls, isLoading: hallsLoading } = trpc.banquetHalls.list.useQuery();
  const { data: menus, isLoading: menusLoading } = trpc.foodMenus.list.useQuery();
  const { data: services, isLoading: servicesLoading } = trpc.additionalServices.list.useQuery();
  
  // Get selected halls
  const selectedHalls = useMemo(() => {
    if (!halls) return [];
    return venues.map(v => halls.find(h => h.id.toString() === v.hallId)).filter(Boolean);
  }, [halls, venues]);
  
  const selectedMenu = useMemo(() => {
    if (!menus || !selectedMenuId) return null;
    return menus.find(m => m.id.toString() === selectedMenuId);
  }, [menus, selectedMenuId]);
  
  const selectedServicesList = useMemo(() => {
    if (!services) return [];
    return services.filter(s => selectedServices.has(s.id));
  }, [services, selectedServices]);

  // Calculate costs
  const hallRateCost = useMemo(() => {
    return venues.reduce((sum, venue) => {
      const hall = halls?.find(h => h.id.toString() === venue.hallId);
      const rate = parseFloat(venue.customRate) || parseFloat(hall?.baseRate || "0") || 0;
      return sum + (isNaN(rate) ? 0 : rate);
    }, 0);
  }, [venues, halls]);

  const menuCost = useMemo(() => {
    if (!selectedMenu || !numberOfGuests) return 0;
    const pricePerPerson = parseFloat(selectedMenu.pricePerPerson) || 0;
    const guests = parseInt(numberOfGuests) || 0;
    return pricePerPerson * guests;
  }, [selectedMenu, numberOfGuests]);

  const customMenuCost = useMemo(() => {
    return customMenuPackages.reduce((sum, pkg) => {
      const pricePerPerson = parseFloat(pkg.pricePerPerson) || 0;
      const guests = parseInt(numberOfGuests) || 0;
      return sum + (pricePerPerson * guests);
    }, 0);
  }, [customMenuPackages, numberOfGuests]);

  const customFoodCost = useMemo(() => {
    return customFoodItems.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.quantity) || 0;
      return sum + (price * qty);
    }, 0);
  }, [customFoodItems]);

  const servicesCost = useMemo(() => {
    return selectedServicesList.reduce((sum, service) => {
      const price = parseFloat(service.price) || 0;
      return sum + price;
    }, 0);
  }, [selectedServicesList]);

  const customServicesCost = useMemo(() => {
    return customServices.reduce((sum, service) => {
      const price = parseFloat(service.price) || 0;
      return sum + price;
    }, 0);
  }, [customServices]);

  const subtotal = useMemo(() => {
    return hallRateCost + menuCost + customMenuCost + customFoodCost + servicesCost + customServicesCost;
  }, [hallRateCost, menuCost, customMenuCost, customFoodCost, servicesCost, customServicesCost]);

  // Tax calculations
  const salesTax = useMemo(() => subtotal * 0.10, [subtotal]); // 10% sales tax
  const advanceTax = useMemo(() => {
    if (!confirmNow) return 0;
    return isTaxFiler ? subtotal * 0.10 : subtotal * 0.20; // 10% for filers, 20% for non-filers
  }, [subtotal, confirmNow, isTaxFiler]);

  const totalAmount = useMemo(() => {
    return subtotal + salesTax + advanceTax;
  }, [subtotal, salesTax, advanceTax]);

  const createBookingMutation = trpc.bookings.createSoftReservation.useMutation({
    onSuccess: (data) => {
      if (confirmNow) {
        toast.success(`Booking confirmed! Booking #${data.bookingNumber}`);
      } else {
        toast.success(`${blockType === 'tentative' ? 'Tentative block' : 'Soft reservation'} created! Booking #${data.bookingNumber}`);
      }
      setLocation("/sales");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create booking");
    },
  });
  
  const confirmBookingMutation = trpc.bookings.confirmBooking.useMutation({
    onSuccess: () => {
      toast.success("Booking confirmed successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to confirm booking");
    },
  });

  // Venue management
  const addVenue = () => {
    setVenues([...venues, { hallId: "", eventTime: "", customRate: "" }]);
  };

  const removeVenue = (index: number) => {
    if (venues.length > 1) {
      setVenues(venues.filter((_, i) => i !== index));
    }
  };

  const updateVenue = (index: number, field: keyof VenueSelection, value: string) => {
    const updated = [...venues];
    updated[index] = { ...updated[index], [field]: value };
    setVenues(updated);
  };

  // Custom food items
  const addCustomFoodItem = () => {
    setCustomFoodItems([...customFoodItems, { itemName: "", quantity: "1", price: "0" }]);
  };

  const removeCustomFoodItem = (index: number) => {
    setCustomFoodItems(customFoodItems.filter((_, i) => i !== index));
  };

  const updateCustomFoodItem = (index: number, field: keyof CustomMenuItem, value: string) => {
    const updated = [...customFoodItems];
    updated[index] = { ...updated[index], [field]: value };
    setCustomFoodItems(updated);
  };

  // Custom menu packages
  const addCustomMenuPackage = () => {
    setCustomMenuPackages([...customMenuPackages, { menuName: "", items: [], pricePerPerson: "" }]);
  };

  const removeCustomMenuPackage = (index: number) => {
    setCustomMenuPackages(customMenuPackages.filter((_, i) => i !== index));
  };

  const updateCustomMenuPackage = (index: number, field: string, value: string | string[]) => {
    const updated = [...customMenuPackages];
    updated[index] = { ...updated[index], [field]: value };
    setCustomMenuPackages(updated);
  };

  // Custom services
  const addCustomService = () => {
    setCustomServices([...customServices, { serviceName: "", description: "", price: "" }]);
  };

  const removeCustomService = (index: number) => {
    setCustomServices(customServices.filter((_, i) => i !== index));
  };

  const updateCustomService = (index: number, field: keyof CustomServiceItem, value: string) => {
    const updated = [...customServices];
    updated[index] = { ...updated[index], [field]: value };
    setCustomServices(updated);
  };

  const toggleService = (serviceId: number) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const primaryVenue = venues[0];
    if (!primaryVenue?.hallId || !eventDate || !clientName || !clientPhone || !numberOfGuests) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (confirmNow) {
      if (!tokenAmount) {
        toast.error("Please enter token amount for confirmation");
        return;
      }
      if (!clientCnic) {
        toast.error("CNIC is required for booking confirmation");
        return;
      }
    }

    const primaryHall = halls?.find(h => h.id.toString() === primaryVenue.hallId);
    const hallRate = primaryVenue.customRate || primaryHall?.baseRate || "0";

    const bookingData = {
      banquetHallId: parseInt(primaryVenue.hallId),
      eventDate: new Date(eventDate),
      clientName,
      clientEmail: clientEmail || undefined,
      clientPhone,
      eventType: eventType || undefined,
      numberOfGuests: parseInt(numberOfGuests),
      hallRate,
      totalAmount: totalAmount.toFixed(2),
      notes: notes || undefined,
      menuId: selectedMenuId ? parseInt(selectedMenuId) : undefined,
      customFoodItems: customFoodItems.filter(item => item.itemName.trim()).map(item => ({
        itemName: item.itemName,
        quantity: parseInt(item.quantity || "1"),
        price: item.price,
      })),
      serviceIds: Array.from(selectedServices),
    };
    
    if (confirmNow) {
      createBookingMutation.mutate(bookingData, {
        onSuccess: (data) => {
          confirmBookingMutation.mutate({
            bookingId: data.id,
            tokenAmount,
            paymentMethod: paymentMethod || undefined,
          });
        },
      });
    } else {
      createBookingMutation.mutate(bookingData);
    }
  };

  return (
    <DashboardLayout
      title="Create Booking"
      navItems={[
        { label: "Back to Dashboard", href: "/sales", icon: Calendar },
      ]}
    >
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Booking</CardTitle>
          <CardDescription>Enter booking details including venues, food menu, services, and vendor information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Block Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-5 w-5" />
                Booking Type
              </h3>
              <div className="flex gap-4">
                <label className={`flex items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${blockType === 'tentative' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <input
                    type="radio"
                    name="blockType"
                    value="tentative"
                    checked={blockType === 'tentative'}
                    onChange={() => setBlockType('tentative')}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 ${blockType === 'tentative' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                    {blockType === 'tentative' && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                  </div>
                  <div>
                    <p className="font-medium">Tentative Block</p>
                    <p className="text-xs text-muted-foreground">Soft hold, time-limited, can be released</p>
                  </div>
                </label>
                <label className={`flex items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${blockType === 'definite' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <input
                    type="radio"
                    name="blockType"
                    value="definite"
                    checked={blockType === 'definite'}
                    onChange={() => setBlockType('definite')}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 ${blockType === 'definite' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                    {blockType === 'definite' && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                  </div>
                  <div>
                    <p className="font-medium">Definite Block</p>
                    <p className="text-xs text-muted-foreground">Confirmed, requires approval to release</p>
                  </div>
                </label>
              </div>
            </div>

            <Separator />

            {/* Multi-Venue Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Venue Selection
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addVenue}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Another Venue
                </Button>
              </div>
              
              {venues.map((venue, index) => {
                const selectedHall = halls?.find(h => h.id.toString() === venue.hallId);
                return (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Venue {index + 1}</Badge>
                      {venues.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeVenue(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Select Hall *</Label>
                        {hallsLoading ? (
                          <div className="flex items-center gap-2 p-3 border rounded-md">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading...</span>
                          </div>
                        ) : (
                          <Select value={venue.hallId} onValueChange={(v) => updateVenue(index, 'hallId', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select hall" />
                            </SelectTrigger>
                            <SelectContent>
                              {halls?.map((hall) => (
                                <SelectItem key={hall.id} value={hall.id.toString()}>
                                  {hall.name} - Cap: {hall.capacity}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Event Time
                        </Label>
                        <Input
                          type="time"
                          value={venue.eventTime}
                          onChange={(e) => updateVenue(index, 'eventTime', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Custom Rate (PKR)</Label>
                        <Input
                          type="number"
                          placeholder={selectedHall?.baseRate || "Base rate"}
                          value={venue.customRate}
                          onChange={(e) => updateVenue(index, 'customRate', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {selectedHall && (
                      <div className="p-3 bg-muted rounded-md text-sm">
                        <p><strong>Capacity:</strong> {selectedHall.capacity} | <strong>Base Rate:</strong> PKR {parseFloat(selectedHall.baseRate || "0").toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Event Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Event Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="Wedding, Corporate Event, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfGuests" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Number of Guests *
                  </Label>
                  <Input
                    id="numberOfGuests"
                    type="number"
                    min="1"
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(e.target.value)}
                    placeholder="Confirmed guests"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedGuests">Expected Guests</Label>
                  <Input
                    id="expectedGuests"
                    type="number"
                    min="0"
                    value={expectedGuests}
                    onChange={(e) => setExpectedGuests(e.target.value)}
                    placeholder="Expected total"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomsRequired">Rooms Required</Label>
                  <Input
                    id="roomsRequired"
                    type="number"
                    min="0"
                    value={roomsRequired}
                    onChange={(e) => setRoomsRequired(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Client Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Client Phone *</Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                />
              </div>

              {/* CNIC and NTN - shown when confirming */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientCnic">
                    CNIC {confirmNow && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="clientCnic"
                    value={clientCnic}
                    onChange={(e) => setClientCnic(e.target.value)}
                    placeholder="12345-1234567-1"
                    required={confirmNow}
                  />
                  <p className="text-xs text-muted-foreground">Required for booking confirmation</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientNtn">NTN (National Tax Number)</Label>
                  <Input
                    id="clientNtn"
                    value={clientNtn}
                    onChange={(e) => setClientNtn(e.target.value)}
                    placeholder="1234567-8"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Food Menu Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Food Menu</h3>
              
              <div className="space-y-2">
                <Label htmlFor="menu">Select Menu Package</Label>
                {menusLoading ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading menus...</span>
                  </div>
                ) : (
                  <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
                    <SelectTrigger id="menu">
                      <SelectValue placeholder="Select a food menu (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {menus?.map((menu) => (
                        <SelectItem key={menu.id} value={menu.id.toString()}>
                          {menu.name} - PKR {parseFloat(menu.pricePerPerson).toLocaleString()}/person
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedMenu && (
                  <div className="p-3 bg-muted rounded-md text-sm space-y-2">
                    <p><strong>{selectedMenu.name}</strong> - PKR {parseFloat(selectedMenu.pricePerPerson).toLocaleString()}/person</p>
                    {numberOfGuests && (
                      <p><strong>Total for {numberOfGuests} guests:</strong> PKR {(parseFloat(selectedMenu.pricePerPerson) * parseInt(numberOfGuests)).toLocaleString()}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Custom Menu Packages */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Custom Menu Packages</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCustomMenuPackage}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create Custom Menu
                  </Button>
                </div>
                {customMenuPackages.map((pkg, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">Custom Menu {index + 1}</Badge>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeCustomMenuPackage(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Menu Name</Label>
                        <Input
                          placeholder="e.g., Premium Wedding Menu"
                          value={pkg.menuName}
                          onChange={(e) => updateCustomMenuPackage(index, "menuName", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Price Per Person (PKR)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={pkg.pricePerPerson}
                          onChange={(e) => updateCustomMenuPackage(index, "pricePerPerson", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Menu Items (comma separated)</Label>
                      <Textarea
                        placeholder="Biryani, Korma, Naan, Salad, Dessert..."
                        value={pkg.items.join(", ")}
                        onChange={(e) => updateCustomMenuPackage(index, "items", e.target.value.split(",").map(s => s.trim()))}
                        rows={2}
                      />
                    </div>
                    {numberOfGuests && pkg.pricePerPerson && (
                      <p className="text-sm text-muted-foreground">
                        Total: PKR {(parseFloat(pkg.pricePerPerson) * parseInt(numberOfGuests)).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Custom Food Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Custom Food Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCustomFoodItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                {customFoodItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Item Name</Label>
                      <Input
                        placeholder="e.g., Special Biryani"
                        value={item.itemName}
                        onChange={(e) => updateCustomFoodItem(index, "itemName", e.target.value)}
                      />
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateCustomFoodItem(index, "quantity", e.target.value)}
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">Price</Label>
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateCustomFoodItem(index, "price", e.target.value)}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomFoodItem(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Additional Services */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Services</h3>
              {servicesLoading ? (
                <div className="flex items-center gap-2 p-3 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading services...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {services?.map((service) => (
                    <div key={service.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServices.has(service.id)}
                        onCheckedChange={() => toggleService(service.id)}
                      />
                      <div className="flex-1">
                        <label htmlFor={`service-${service.id}`} className="text-sm font-medium cursor-pointer">
                          {service.name}
                        </label>
                        <p className="text-xs text-muted-foreground">{service.description}</p>
                        <p className="text-sm font-semibold mt-1">PKR {parseFloat(service.price).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom Services */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Custom Services</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCustomService}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Custom Service
                  </Button>
                </div>
                {customServices.map((service, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Service Name</Label>
                      <Input
                        placeholder="e.g., Extra Decoration"
                        value={service.serviceName}
                        onChange={(e) => updateCustomService(index, "serviceName", e.target.value)}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        placeholder="Details..."
                        value={service.description}
                        onChange={(e) => updateCustomService(index, "description", e.target.value)}
                      />
                    </div>
                    <div className="w-28 space-y-1">
                      <Label className="text-xs">Price</Label>
                      <Input
                        type="number"
                        value={service.price}
                        onChange={(e) => updateCustomService(index, "price", e.target.value)}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomService(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Vendor Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Vendor Details (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vendor Name</Label>
                  <Input
                    value={vendorDetails.vendorName}
                    onChange={(e) => setVendorDetails({...vendorDetails, vendorName: e.target.value})}
                    placeholder="Vendor company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vendor Contact</Label>
                  <Input
                    value={vendorDetails.vendorContact}
                    onChange={(e) => setVendorDetails({...vendorDetails, vendorContact: e.target.value})}
                    placeholder="Phone or email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service Provided</Label>
                  <Input
                    value={vendorDetails.vendorService}
                    onChange={(e) => setVendorDetails({...vendorDetails, vendorService: e.target.value})}
                    placeholder="e.g., Flowers, Photography"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vendor Notes</Label>
                  <Input
                    value={vendorDetails.vendorNotes}
                    onChange={(e) => setVendorDetails({...vendorDetails, vendorNotes: e.target.value})}
                    placeholder="Additional notes"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or special requirements"
                rows={3}
              />
            </div>

            <Separator />

            {/* Total Amount with Tax Breakdown */}
            <div className="bg-muted p-4 rounded-lg space-y-4">
              <h3 className="font-semibold">Cost Summary</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Hall Rate(s):</span>
                  <span>PKR {hallRateCost.toLocaleString()}</span>
                </div>
                {menuCost > 0 && (
                  <div className="flex justify-between">
                    <span>Menu ({selectedMenu?.name}) × {numberOfGuests} guests:</span>
                    <span>PKR {menuCost.toLocaleString()}</span>
                  </div>
                )}
                {customMenuCost > 0 && (
                  <div className="flex justify-between">
                    <span>Custom Menu Packages:</span>
                    <span>PKR {customMenuCost.toLocaleString()}</span>
                  </div>
                )}
                {customFoodCost > 0 && (
                  <div className="flex justify-between">
                    <span>Custom Food Items:</span>
                    <span>PKR {customFoodCost.toLocaleString()}</span>
                  </div>
                )}
                {servicesCost > 0 && (
                  <div className="flex justify-between">
                    <span>Additional Services:</span>
                    <span>PKR {servicesCost.toLocaleString()}</span>
                  </div>
                )}
                {customServicesCost > 0 && (
                  <div className="flex justify-between">
                    <span>Custom Services:</span>
                    <span>PKR {customServicesCost.toLocaleString()}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Subtotal:</span>
                  <span>PKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Sales Tax (10%):</span>
                  <span>PKR {salesTax.toLocaleString()}</span>
                </div>
                {confirmNow && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Advance Tax ({isTaxFiler ? '10%' : '20%'} - {isTaxFiler ? 'Filer' : 'Non-Filer'}):</span>
                    <span>PKR {advanceTax.toLocaleString()}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-primary">PKR {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Confirmation Mode */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="confirmNow"
                  checked={confirmNow}
                  onCheckedChange={(checked) => setConfirmNow(checked as boolean)}
                />
                <Label htmlFor="confirmNow" className="cursor-pointer">
                  Confirm booking now (with token payment)
                </Label>
              </div>
              
              {confirmNow && (
                <div className="space-y-4 pl-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tokenAmount">Token Amount (PKR) *</Label>
                      <Input
                        id="tokenAmount"
                        type="number"
                        placeholder="Enter token amount"
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(e.target.value)}
                        required={confirmNow}
                      />
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
                  
                  {/* Tax Filer Status */}
                  <div className="flex items-center gap-4 p-3 bg-background rounded-md">
                    <Label>Customer Tax Status:</Label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="taxFiler"
                        checked={isTaxFiler}
                        onChange={() => setIsTaxFiler(true)}
                      />
                      <span>Tax Filer (10% Advance Tax)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="taxFiler"
                        checked={!isTaxFiler}
                        onChange={() => setIsTaxFiler(false)}
                      />
                      <span>Non-Filer (20% Advance Tax)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createBookingMutation.isPending || (confirmNow && (!tokenAmount || !clientCnic))}
                className="flex-1"
              >
                {createBookingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {confirmNow ? "Confirming..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {confirmNow ? "Confirm Booking Now" : blockType === 'tentative' ? "Create Tentative Block" : "Create Soft Reservation"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/sales")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
