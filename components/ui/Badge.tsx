import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
  {
    variants: {
      tone: {
        neutral: "border-ink-200 bg-white text-ink-700",
        soft: "border-transparent bg-ink-100 text-ink-700",
        verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
        accent: "border-rose-200 bg-rose-50 text-brand",
        warning: "border-amber-200 bg-amber-50 text-amber-700",
        metro: "border-blue-200 bg-blue-50 text-metro-blue",
        outline: "border-ink-300 bg-transparent text-ink-700",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
