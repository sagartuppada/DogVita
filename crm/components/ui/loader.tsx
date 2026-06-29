import { cn } from "@/lib/utils";
import { PawPrint } from "lucide-react";

export function Loader({
  label,
  className,
  fullScreen,
}: {
  label?: string;
  className?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-cocoa-tertiary",
        fullScreen && "h-screen",
        className,
      )}
    >
      <PawPrint className="h-7 w-7 animate-pulse text-primary" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
