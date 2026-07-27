import type { LucideProps } from "lucide-react";
import { RotateCcw } from "lucide-react";

export function RotateCcwIcon({ "aria-hidden": ariaHidden, focusable, ...props }: LucideProps) {
  return <RotateCcw {...props} aria-hidden={ariaHidden ?? true} focusable={focusable ?? false} />;
}
