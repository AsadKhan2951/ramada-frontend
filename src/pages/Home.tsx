import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calendar, UtensilsCrossed, DollarSign, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login');
    }
  }, [loading, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const departments = [
    {
      name: "Sales",
      description: "Create and manage bookings, soft reservations, and client interactions",
      icon: Calendar,
      path: "/sales",
      color: "bg-[#FA2B00]",
    },
    {
      name: "Operations",
      description: "View upcoming events, manage hall schedules, and coordinate logistics",
      icon: Building2,
      path: "/operations",
      color: "bg-gray-700",
    },
    {
      name: "Food & Beverage",
      description: "Manage menus, view food orders, and coordinate catering services",
      icon: UtensilsCrossed,
      path: "/food",
      color: "bg-gray-600",
    },
    {
      name: "Finance",
      description: "Track payments, manage invoices, and monitor financial transactions",
      icon: DollarSign,
      path: "/finance",
      color: "bg-gray-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="container py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src="/rad-logo-new.jpeg" alt="rad.bms" className="w-12 h-12 rounded-xl" />
            <h1 className="text-4xl font-bold text-foreground">rad.bms</h1>
          </div>
          <p className="text-xl text-muted-foreground">Banquet Management System</p>
          <p className="text-sm text-muted-foreground mt-2">Welcome, {user?.name || user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {departments.map((dept) => (
            <Link key={dept.path} href={dept.path}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`${dept.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                      <dept.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{dept.name}</CardTitle>
                      <CardDescription className="text-sm">{dept.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {user?.accessLevel === 'full' && (
          <div className="mt-12 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Admin Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/manage/halls">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Manage Halls</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/manage/menus">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Manage Menus</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/manage/services">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base">Manage Services</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
              <Link href="/admin/reports">
                <Card className="hover:shadow-md transition-shadow cursor-pointer bg-[#FA2B00] text-white">
                  <CardHeader>
                    <CardTitle className="text-base">Admin Reports</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
