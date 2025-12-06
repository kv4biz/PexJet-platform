"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    
    if (token) {
      // Check if token is expired or invalid
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        
        if (!isExpired) {
          router.replace("/dashboard");
          return;
        }
        
        // Token is expired - clear it and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } catch {
        // Invalid token format - clear it
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    }
    
    // No valid token, go to login
    router.replace("/login");
  }, [router]);

  return (
    <main className="flex h-screen items-center justify-center">
      <section className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent" />
    </main>
  );
}
