"use client";

import { Toaster as SonnerComp } from "sonner";
import * as React from "react";

type SonnerProps = React.ComponentProps<typeof SonnerComp>;

const SonnerGlobal = ({ ...props }: SonnerProps) => {
  return (
    <SonnerComp
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { SonnerGlobal };
