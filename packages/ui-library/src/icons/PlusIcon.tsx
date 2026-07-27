import type { LucideProps } from "lucide-react";
import { Plus } from "lucide-react";

export function PlusIcon({ "aria-hidden": ariaHidden, focusable, ...props }: LucideProps) {
  return <Plus {...props} aria-hidden={ariaHidden ?? true} focusable={focusable ?? false} />;
}
