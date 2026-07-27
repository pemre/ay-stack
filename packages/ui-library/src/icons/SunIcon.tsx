import type { LucideProps } from "lucide-react";
import { Sun } from "lucide-react";

export function SunIcon({ "aria-hidden": ariaHidden, focusable, ...props }: LucideProps) {
  return <Sun {...props} aria-hidden={ariaHidden ?? true} focusable={focusable ?? false} />;
}
