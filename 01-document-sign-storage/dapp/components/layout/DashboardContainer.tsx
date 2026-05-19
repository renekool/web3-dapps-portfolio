"use client";

import React from "react";

interface DashboardContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardContainer = ({
  children,
  className = "",
}: DashboardContainerProps) => {
  return (
    <div className={`w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative ${className}`}>
      {children}
    </div>
  );
};
