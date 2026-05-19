import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <main
      className={`flex-1 max-w-[960px] w-full mx-auto px-4 sm:px-6 pt-[120px] pb-24 space-y-8 ${className}`}
    >
      {children}
    </main>
  );
}
