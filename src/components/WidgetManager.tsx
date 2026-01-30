import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Calendar,
  Clock,
  CreditCard,
  LayoutGrid,
  List,
  PieChart,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  GripVertical,
  Settings2,
} from "lucide-react";
import { WidgetConfig, AvailableWidget, WidgetPicker } from "./WidgetGrid";

// Available widgets catalog
export const AVAILABLE_WIDGETS: AvailableWidget[] = [
  {
    type: "viewToggle",
    title: "Booking Views",
    description: "Toggle between Calendar and List view of all bookings",
    icon: <LayoutGrid className="h-4 w-4" />,
    defaultSize: "full",
  },
  {
    type: "greeting",
    title: "Welcome Banner",
    description: "Personalized greeting with today's date and quick stats",
    icon: <Users className="h-4 w-4" />,
    defaultSize: "full",
  },
  {
    type: "stats",
    title: "Stats Cards",
    description: "Key metrics including bookings, revenue, and conversion rate",
    icon: <BarChart3 className="h-4 w-4" />,
    defaultSize: "full",
  },
  {
    type: "charts",
    title: "Sales Analytics",
    description: "Revenue trends and booking distribution charts",
    icon: <TrendingUp className="h-4 w-4" />,
    defaultSize: "full",
  },
  {
    type: "upcoming",
    title: "Upcoming Events",
    description: "List of upcoming bookings in the next 30 days",
    icon: <Calendar className="h-4 w-4" />,
    defaultSize: "large",
  },
  {
    type: "todayEvents",
    title: "Today's Events",
    description: "Events scheduled for today",
    icon: <Clock className="h-4 w-4" />,
    defaultSize: "medium",
  },
  {
    type: "paymentFollowups",
    title: "Payment Follow-ups",
    description: "Bookings requiring payment attention",
    icon: <CreditCard className="h-4 w-4" />,
    defaultSize: "medium",
  },
  {
    type: "softReservations",
    title: "Soft Reservations",
    description: "Pending reservations to convert",
    icon: <AlertCircle className="h-4 w-4" />,
    defaultSize: "medium",
  },
  {
    type: "recentBookings",
    title: "Recent Bookings",
    description: "Latest bookings created",
    icon: <List className="h-4 w-4" />,
    defaultSize: "large",
  },
  {
    type: "quickActions",
    title: "Quick Actions",
    description: "Shortcuts to common tasks",
    icon: <Plus className="h-4 w-4" />,
    defaultSize: "small",
  },
  {
    type: "calendarMini",
    title: "Mini Calendar",
    description: "Compact calendar view with event indicators",
    icon: <Calendar className="h-4 w-4" />,
    defaultSize: "medium",
  },
];

// Default widget configuration - View toggle at top, then greeting, stats, views, analytics
export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "greeting-1", type: "greeting", title: "Welcome Banner", order: 0, size: "full", hideTitle: true },
  { id: "stats-1", type: "stats", title: "Stats Cards", order: 1, size: "full", hideTitle: true },
  { id: "viewToggle-1", type: "viewToggle", title: "Booking Views", order: 2, size: "full", hideTitle: true },
  { id: "charts-1", type: "charts", title: "Sales Analytics", order: 3, size: "full", hideTitle: true },
  { id: "upcoming-1", type: "upcoming", title: "Upcoming Events", order: 4, size: "large", hideTitle: true },
  { id: "paymentFollowups-1", type: "paymentFollowups", title: "Payment Follow-ups", order: 5, size: "medium", hideTitle: true },
];

interface WidgetManagerProps {
  open: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
}

export function WidgetManager({
  open,
  onClose,
  widgets,
  onWidgetsChange,
  isEditing,
  onEditingChange,
}: WidgetManagerProps) {
  const [activeTab, setActiveTab] = useState("add");

  const activeWidgetTypes = widgets.map((w) => w.type);

  const handleAddWidget = (widget: AvailableWidget) => {
    const newWidget: WidgetConfig = {
      id: `${widget.type}-${Date.now()}`,
      type: widget.type,
      title: widget.title,
      order: widgets.length,
      size: widget.defaultSize,
    };
    onWidgetsChange([...widgets, newWidget]);
  };

  const handleRemoveWidget = (widgetId: string) => {
    onWidgetsChange(widgets.filter((w) => w.id !== widgetId));
  };

  const handleResetToDefault = () => {
    onWidgetsChange(DEFAULT_WIDGETS);
  };

  const handleSizeChange = (widgetId: string, size: "small" | "medium" | "large" | "full") => {
    onWidgetsChange(
      widgets.map((w) => (w.id === widgetId ? { ...w, size } : w))
    );
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Customize Dashboard
          </DialogTitle>
          <DialogDescription>
            Add, remove, and arrange widgets to personalize your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-2">
            <Switch
              id="edit-mode"
              checked={isEditing}
              onCheckedChange={onEditingChange}
            />
            <Label htmlFor="edit-mode" className="text-sm">
              Edit Mode {isEditing && <Badge variant="secondary" className="ml-2">Active</Badge>}
            </Label>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetToDefault}>
            Reset to Default
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">Add Widgets</TabsTrigger>
            <TabsTrigger value="manage">Manage Active ({widgets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="mt-4 overflow-auto max-h-[400px]">
            <WidgetPicker
              availableWidgets={AVAILABLE_WIDGETS}
              activeWidgetTypes={activeWidgetTypes}
              onAddWidget={handleAddWidget}
            />
          </TabsContent>

          <TabsContent value="manage" className="mt-4 overflow-auto max-h-[400px]">
            <div className="space-y-2">
              {widgets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <LayoutGrid className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No widgets added yet</p>
                  <p className="text-sm">Go to "Add Widgets" to get started</p>
                </div>
              ) : (
                widgets
                  .sort((a, b) => a.order - b.order)
                  .map((widget) => (
                    <div
                      key={widget.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{widget.title}</div>
                        <div className="text-xs text-muted-foreground">
                          Size: {widget.size}
                        </div>
                      </div>
                      <select
                        value={widget.size}
                        onChange={(e) =>
                          handleSizeChange(
                            widget.id,
                            e.target.value as "small" | "medium" | "large" | "full"
                          )
                        }
                        className="text-xs border rounded px-2 py-1 bg-background"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="full">Full Width</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveWidget(widget.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
