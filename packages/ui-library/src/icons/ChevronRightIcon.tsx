import type { LucideProps } from "lucide-react";
import { ChevronRight } from "lucide-react";

export function ChevronRightIcon({ "aria-hidden": ariaHidden, focusable, ...props }: LucideProps) {
  return (
    <ChevronRight {...props} aria-hidden={ariaHidden ?? true} focusable={focusable ?? false} />
  );
}
