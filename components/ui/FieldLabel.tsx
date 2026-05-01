import * as React from "react";
import { cn } from "../../lib/utils";

type FieldLabelProps = React.HTMLAttributes<HTMLLabelElement> & {
  htmlFor?: string;
  hint?: string;
  required?: boolean;
};

export function FieldLabel({ className, hint, required, children, ...props }: FieldLabelProps) {
  const arr = React.Children.toArray(children);
  const labelText = arr[0];
  const rest = arr.slice(1);
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)} {...props}>
      <span className="font-medium text-ink-900">
        {labelText}
        {required && <span className="ml-1 text-brand">*</span>}
        {hint && <span className="ml-2 text-xs font-normal text-ink-500">{hint}</span>}
      </span>
      {rest}
    </label>
  );
}
