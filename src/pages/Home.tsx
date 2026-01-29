import { useEffect } from "react";
import { useLocation } from "wouter";
import Login from "./Login";

export default function Home() {
  const [, setLocation] = useLocation();
  
  // Check if user is already logged in
  useEffect(() => {
    const staffSession = localStorage.getItem("staffSession");
    if (staffSession) {
      try {
        const session = JSON.parse(staffSession);
        if (session && session.id) {
          // User is logged in, redirect to sales dashboard
          setLocation("/sales");
        }
      } catch {
        // Invalid session, stay on login
      }
    }
  }, [setLocation]);

  // Home page is now the login page
  return <Login />;
}
