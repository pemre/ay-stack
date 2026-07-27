import type { LucideProps } from "lucide-react";
import { ChevronDown } from "lucide-react";

export function ChevronDownIcon({ "aria-hidden": ariaHidden, focusable, ...props }: LucideProps) {
  return <ChevronDown {...props} aria-hidden={ariaHidden ?? true} focusable={focusable ?? false} />;
}
