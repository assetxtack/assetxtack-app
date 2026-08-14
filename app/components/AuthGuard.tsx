"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        // User is not logged in, redirect to sign in
        router.push("/sign-in");
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-6 flex flex-col gap-6 animate-pulse">
        {/* Top Header Skeleton */}
        <div className="h-16 w-full rounded-xl bg-slate-800" />

        {/* Hero / Banner Skeleton */}
        <div className="h-40 w-full rounded-2xl bg-slate-800" />

        {/* Metric Cards Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 rounded-xl bg-slate-800" />
          <div className="h-32 rounded-xl bg-slate-800" />
          <div className="h-32 rounded-xl bg-slate-800" />
        </div>

        {/* Content Table / Chart Skeleton */}
        <div className="h-64 w-full rounded-2xl bg-slate-800" />
      </div>
    );
  }

  // If user exists, render the protected page content
  if (user) {
    return <>{children}</>;
  }

  return null;
}