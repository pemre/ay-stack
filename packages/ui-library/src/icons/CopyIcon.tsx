import type { LucideProps } from "lucide-react";
import { Copy } from "lucide-react";

export function CopyIcon({ "aria-hidden": ariaHidden, focusable, ...props }: LucideProps) {
  return <Copy {...props} aria-hidden={ariaHidden ?? true} focusable={focusable ?? false} />;
}
