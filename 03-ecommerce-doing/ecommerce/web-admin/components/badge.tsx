import type * as React from "react";
import {cva, type VariantProps} from "class-variance-authority";

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  "inline-flex items-center cursor-auto rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-destructive/20 bg-destructive/10 text-destructive",
        success: "border-success/20 bg-success/10 text-success",
        warning: "border-warning/20 bg-warning/10 text-warning",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
}

function Badge({className, variant, ...props}: BadgeProps) {
  return <div className={cn(badgeVariants({variant}), className)} {...props} />;
}

export {Badge, badgeVariants};

