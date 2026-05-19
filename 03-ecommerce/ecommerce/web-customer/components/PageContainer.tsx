import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`max-w-6xl mx-auto px-6 py-8 pt-[calc(64px+2rem)] ${className}`}>
      {children}
    </div>
  );
}
