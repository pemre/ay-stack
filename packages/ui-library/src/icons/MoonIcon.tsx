import type { LucideProps } from "lucide-react";
import { Moon } from "lucide-react";

export function MoonIcon({ "aria-hidden": ariaHidden, focusable, ...props }: LucideProps) {
  return <Moon {...props} aria-hidden={ariaHidden ?? true} focusable={focusable ?? false} />;
}
