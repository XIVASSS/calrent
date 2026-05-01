import * as React from "react";
import { cn } from "../../lib/utils";

type AvatarProps = {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
};

export function Avatar({ name, src, size = 36, className }: AvatarProps) {
  const initials = (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (src) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-100",
          className
        )}
        style={{ width: size, height: size }}
      >
        <img src={src} alt={name ?? "Avatar"} className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-rose-50 text-xs font-semibold text-brand",
        className
      )}
      style={{ width: size, height: size }}
    >
      {initials || "•"}
    </span>
  );
}
