import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, LogOut, Moon, Search, Settings, Sun, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface StaffSession {
  id: number;
  name: string;
  email: string;
  jobTitle: string;
  department: string;
  accessLevel: string;
}

interface DashboardHeaderProps {
  onSearchClick: () => void;
  onNotificationsClick: () => void;
  unreadCount?: number;
}

export function DashboardHeader({
  onSearchClick,
  onNotificationsClick,
  unreadCount = 0,
}: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [staffSession, setStaffSession] = useState<StaffSession | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("darkMode");
      if (saved !== null) return saved === "true";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Check for staff session on mount
  useEffect(() => {
    const stored = localStorage.getItem("staffSession");
    if (stored) {
      try {
        setStaffSession(JSON.parse(stored));
      } catch {
        setStaffSession(null);
      }
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Use staff session if available, otherwise fall back to OAuth user
  const displayName = staffSession?.name || user?.name || "User";
  const displayEmail = staffSession?.email || user?.email || "";
  const displayDepartment = staffSession?.department || user?.department || undefined;
  const displayJobTitle = staffSession?.jobTitle;

  const handleLogout = () => {
    // Clear staff session
    localStorage.removeItem("staffSession");
    setStaffSession(null);
    // Redirect to login
    setLocation("/");
  };

  const getDepartmentColor = (department?: string) => {
    switch (department) {
      case "sales":
        return "bg-black text-white dark:bg-white dark:text-black";
      case "operations":
        return "bg-gray-700 text-white dark:bg-gray-300 dark:text-black";
      case "food":
        return "bg-gray-600 text-white dark:bg-gray-400 dark:text-black";
      case "finance":
        return "bg-gray-500 text-white dark:bg-gray-500 dark:text-white";
      default:
        return "bg-gray-400 text-white dark:bg-gray-600 dark:text-white";
    }
  };

  const getDepartmentLabel = (department?: string) => {
    if (!department) return "No Department";
    return department.charAt(0).toUpperCase() + department.slice(1);
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
      <div className="flex h-14 md:h-16 items-center justify-between px-3 md:px-6">
        {/* Left side - can be used for page title or breadcrumbs */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold tracking-tight">
            {/* Page title will be passed from individual dashboards */}
          </h1>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Search Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onSearchClick}
            className="h-8 w-8 md:h-9 md:w-9 relative"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onNotificationsClick}
            className="h-8 w-8 md:h-9 md:w-9 relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 rounded-full bg-red-600 text-white text-[10px] md:text-xs flex items-center justify-center font-medium">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {/* Dark Mode Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleDarkMode}
            className="h-8 w-8 md:h-9 md:w-9 relative"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-yellow-500" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 md:gap-3 rounded-lg px-2 md:px-3 py-2 hover:bg-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-7 w-7 md:h-8 md:w-8 border">
                  <AvatarFallback className="text-xs font-medium">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium leading-none">
                      {displayName}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-xs px-2 py-0 ${getDepartmentColor(displayDepartment)}`}
                    >
                      {getDepartmentLabel(displayDepartment)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground leading-none">
                    {displayJobTitle || displayEmail}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Show user info on mobile */}
              <div className="sm:hidden px-2 py-2 border-b mb-1">
                <p className="font-medium text-sm">{displayName}</p>
                <p className="text-xs text-muted-foreground">{displayJobTitle || displayEmail}</p>
                <Badge
                  variant="secondary"
                  className={`text-xs px-2 py-0 mt-1 ${getDepartmentColor(displayDepartment)}`}
                >
                  {getDepartmentLabel(displayDepartment)}
                </Badge>
              </div>
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleDarkMode} className="cursor-pointer sm:hidden">
                {isDarkMode ? (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark Mode</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
