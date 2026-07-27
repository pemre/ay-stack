import type { LucideProps } from "lucide-react";
import { Check } from "lucide-react";

export function CheckIcon({ "aria-hidden": ariaHidden, focusable, ...props }: LucideProps) {
  return <Check {...props} aria-hidden={ariaHidden ?? true} focusable={focusable ?? false} />;
}
