import type { LucideProps } from "lucide-react";
import { X } from "lucide-react";

export function XIcon({ "aria-hidden": ariaHidden, focusable, ...props }: LucideProps) {
  return <X {...props} aria-hidden={ariaHidden ?? true} focusable={focusable ?? false} />;
}
