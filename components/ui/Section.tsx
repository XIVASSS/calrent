import * as React from "react";
import { cn } from "../../lib/utils";

type SectionProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  bordered?: boolean;
};

export function Section({
  className,
  title,
  subtitle,
  rightSlot,
  bordered,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "space-y-4",
        bordered && "border-t border-ink-100 pt-8",
        className
      )}
      {...props}
    >
      {(title || subtitle || rightSlot) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
            )}
          </div>
          {rightSlot}
        </div>
      )}
      {children}
    </section>
  );
}
