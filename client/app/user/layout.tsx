"use client";
import { useAuth } from "@/hooks/useAuth";
import React from "react";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-900"></div>
          <p className="text-lg font-medium text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden grid grid-cols-1 lg:grid-cols-[400px_1fr] xl:grid-cols-[500px_1fr]">
      {children}
    </div>
  );
}
