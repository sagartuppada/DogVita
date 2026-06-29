import { cn } from "@/lib/utils";

export const Input = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn(
      "h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-cocoa",
      "placeholder:text-cocoa-tertiary",
      "focus-ring",
      className,
    )}
    {...props}
  />
);
