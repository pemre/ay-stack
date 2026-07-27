import type { LucideProps } from "lucide-react";
import { Settings } from "lucide-react";

export function SettingsIcon({ "aria-hidden": ariaHidden, focusable, ...props }: LucideProps) {
  return <Settings {...props} aria-hidden={ariaHidden ?? true} focusable={focusable ?? false} />;
}
