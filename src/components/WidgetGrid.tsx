import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  GripVertical, 
  X, 
  Plus, 
  Move, 
  Maximize2, 
  Minimize2,
  Settings2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  order: number;
  size: "small" | "medium" | "large" | "full";
  hideTitle?: boolean;
}

export interface WidgetGridProps {
  widgets: WidgetConfig[];
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
  onRemoveWidget: (widgetId: string) => void;
  renderWidget: (widget: WidgetConfig) => React.ReactNode;
  isEditing?: boolean;
}

const SIZES: Array<"small" | "medium" | "large" | "full"> = ["small", "medium", "large", "full"];

const getSizeClasses = (size: string) => {
  switch (size) {
    case "small":
      return "col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3";
    case "medium":
      return "col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-6";
    case "large":
      return "col-span-12 sm:col-span-12 md:col-span-8 lg:col-span-9";
    case "full":
      return "col-span-12";
    default:
      return "col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3";
  }
};

const getSizeLabel = (size: string) => {
  switch (size) {
    case "small": return "Small (1/4)";
    case "medium": return "Medium (1/2)";
    case "large": return "Large (3/4)";
    case "full": return "Full Width";
    default: return "Small";
  }
};

const getSizeIcon = (size: string) => {
  switch (size) {
    case "small": return "▪";
    case "medium": return "▪▪";
    case "large": return "▪▪▪";
    case "full": return "▪▪▪▪";
    default: return "▪";
  }
};

export function WidgetGrid({
  widgets,
  onWidgetsChange,
  onRemoveWidget,
  renderWidget,
  isEditing = false,
}: WidgetGridProps) {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOverWidget, setDragOverWidget] = useState<string | null>(null);
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", widgetId);
    // Add a slight delay to show drag effect
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => {
      target.style.opacity = "0.5";
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, widgetId: string) => {
    e.preventDefault();
    if (draggedWidget && draggedWidget !== widgetId) {
      setDragOverWidget(widgetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverWidget(null);
  };

  const handleDrop = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetWidgetId) return;

    const draggedIndex = widgets.findIndex((w) => w.id === draggedWidget);
    const targetIndex = widgets.findIndex((w) => w.id === targetWidgetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);

    // Update order values
    const reorderedWidgets = newWidgets.map((w, index) => ({
      ...w,
      order: index,
    }));

    onWidgetsChange(reorderedWidgets);
    setDraggedWidget(null);
    setDragOverWidget(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = "1";
    setDraggedWidget(null);
    setDragOverWidget(null);
  };

  const handleResizeWidget = useCallback((widgetId: string, newSize: "small" | "medium" | "large" | "full") => {
    const updatedWidgets = widgets.map(w => 
      w.id === widgetId ? { ...w, size: newSize } : w
    );
    onWidgetsChange(updatedWidgets);
  }, [widgets, onWidgetsChange]);

  const cycleSize = useCallback((widgetId: string, direction: "up" | "down") => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    
    const currentIndex = SIZES.indexOf(widget.size);
    let newIndex: number;
    
    if (direction === "up") {
      newIndex = Math.min(currentIndex + 1, SIZES.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }
    
    handleResizeWidget(widgetId, SIZES[newIndex]);
  }, [widgets, handleResizeWidget]);

  const sortedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-12 gap-3 sm:gap-4">
      {sortedWidgets.map((widget) => {
        const isHovered = hoveredWidget === widget.id;
        const isDragging = draggedWidget === widget.id;
        const isDragOver = dragOverWidget === widget.id;
        const currentSizeIndex = SIZES.indexOf(widget.size);
        const canShrink = currentSizeIndex > 0;
        const canGrow = currentSizeIndex < SIZES.length - 1;
        
        return (
          <div
            key={widget.id}
            className={`${getSizeClasses(widget.size)} relative group transition-all duration-300 ease-in-out ${
              isDragging ? "opacity-50 scale-[0.98] z-50" : ""
            } ${isDragOver ? "ring-2 ring-primary ring-offset-2 rounded-lg" : ""}`}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, widget.id)}
            onDragOver={(e) => handleDragOver(e, widget.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, widget.id)}
            onDragEnd={handleDragEnd}
            onMouseEnter={() => setHoveredWidget(widget.id)}
            onMouseLeave={() => setHoveredWidget(null)}
          >
            <Card
              className={`h-full overflow-hidden transition-all duration-200 ${
                isEditing ? "ring-2 ring-dashed ring-muted-foreground/30" : ""
              } ${isHovered && !isDragging ? "shadow-lg ring-1 ring-primary/20" : "shadow-sm"}`}
            >
              {/* Widget Controls - Always visible on hover */}
              <div className={`absolute top-2 right-2 z-20 flex items-center gap-1 transition-all duration-200 ${
                isHovered || isEditing ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
              }`}>
                {/* Size Controls */}
                <div className="flex items-center bg-background/95 backdrop-blur-sm rounded-md border shadow-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-r-none hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      cycleSize(widget.id, "down");
                    }}
                    disabled={!canShrink}
                    title="Shrink widget"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                  </Button>
                  
                  {/* Size Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 rounded-none border-x text-xs font-medium hover:bg-muted"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {getSizeIcon(widget.size)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {SIZES.map((size) => (
                        <DropdownMenuItem
                          key={size}
                          onClick={() => handleResizeWidget(widget.id, size)}
                          className={widget.size === size ? "bg-accent" : ""}
                        >
                          <span className="mr-2">{getSizeIcon(size)}</span>
                          {getSizeLabel(size)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-l-none hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      cycleSize(widget.id, "up");
                    }}
                    disabled={!canGrow}
                    title="Expand widget"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                
                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-background/95 backdrop-blur-sm border shadow-md hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveWidget(widget.id);
                  }}
                  title="Remove widget"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              {/* Drag handle - Always visible on hover */}
              <div className={`absolute top-2 left-2 z-20 cursor-grab active:cursor-grabbing transition-all duration-200 ${
                isHovered || isEditing ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
              }`}>
                <div className="p-1.5 rounded-md bg-background/95 backdrop-blur-sm border shadow-md flex items-center gap-0.5 hover:bg-muted">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  <Move className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
              
              {!widget.hideTitle && (
                <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
                  <CardTitle className="text-sm font-medium truncate pr-20">{widget.title}</CardTitle>
                </CardHeader>
              )}
              <CardContent className={`px-3 sm:px-4 pb-3 sm:pb-4 overflow-auto ${widget.hideTitle ? 'pt-3' : ''}`}>
                {renderWidget(widget)}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

// Widget Picker Component
export interface AvailableWidget {
  type: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultSize: "small" | "medium" | "large" | "full";
}

interface WidgetPickerProps {
  availableWidgets: AvailableWidget[];
  activeWidgetTypes: string[];
  onAddWidget: (widget: AvailableWidget) => void;
}

export function WidgetPicker({
  availableWidgets,
  activeWidgetTypes,
  onAddWidget,
}: WidgetPickerProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
      {availableWidgets.map((widget) => {
        const isActive = activeWidgetTypes.includes(widget.type);
        return (
          <div
            key={widget.type}
            className={`p-3 rounded-lg border transition-all ${
              isActive
                ? "bg-muted/50 border-muted-foreground/20 opacity-60"
                : "hover:bg-accent hover:border-accent-foreground/20 cursor-pointer hover:shadow-sm"
            }`}
            onClick={() => !isActive && onAddWidget(widget)}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-background border shrink-0">{widget.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm truncate">{widget.title}</h4>
                  {isActive ? (
                    <span className="text-xs text-muted-foreground ml-2">Added</span>
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {widget.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
