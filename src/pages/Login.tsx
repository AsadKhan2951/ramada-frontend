import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  
  const [selectedUser, setSelectedUser] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get all staff members for the dropdown
  const { data: staffMembers, isLoading: loadingStaff } = trpc.staff.list.useQuery();

  const loginMutation = trpc.staff.login.useMutation({
    onSuccess: (data: any) => {
      setIsLoading(false);
      toast.success(`Welcome, ${data.staff.name}!`);
      
      // Clear any existing session first, then store new staff session
      localStorage.removeItem("staffSession");
      localStorage.setItem("staffSession", JSON.stringify({
        ...data.staff,
        token: data.token,
      }));
      
      // Route based on access level
      if (data.staff.accessLevel === "full") {
        // Full access users go to sales dashboard with admin capabilities
        setLocation("/sales");
      } else {
        // Sales executives go to sales dashboard with limited access
        setLocation("/sales");
      }
    },
    onError: (error: any) => {
      setIsLoading(false);
      toast.error(error.message || "Invalid credentials");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error("Please select your name from the list");
      return;
    }
    
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    
    setIsLoading(true);
    loginMutation.mutate({
      staffId: selectedUser, // MongoDB uses string IDs
      password: password,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-950 dark:to-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-4 bg-white shadow-lg ring-1 ring-black/5">
            <img 
              src="/rad-logo-new.jpeg" 
              alt="rad.bms" 
              className="w-full h-full object-contain p-2 box-border"
            />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">rad.bms</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">Banquet Management System</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-xl bg-white dark:bg-neutral-900">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Staff Login</CardTitle>
            <CardDescription>Select your name and enter your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* User Selection */}
              <div className="space-y-2">
                <Label htmlFor="user" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Select Your Name
                </Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger id="user" className="h-12 w-full">
                    <SelectValue placeholder={loadingStaff ? "Loading..." : "Choose your name"} />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers?.map((staff: any) => (
                      <SelectItem key={staff._id || staff.id} value={(staff._id || staff.id).toString()}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{staff.name}</span>
                          <span className="text-xs text-neutral-500">{staff.jobTitle}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-12 text-white hover:opacity-90"
                style={{ backgroundColor: '#FA2B00' }}
                disabled={isLoading || loadingStaff}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Staff List Info */}
            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <p className="text-xs text-center text-neutral-500 dark:text-neutral-400">
                Authorized personnel only. Contact your administrator if you need access.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-6">
          © 2026 rad.bms. All rights reserved.
        </p>
      </div>
    </div>
  );
}
