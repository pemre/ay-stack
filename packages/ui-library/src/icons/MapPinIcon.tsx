import type { LucideProps } from "lucide-react";
import { MapPin } from "lucide-react";

export function MapPinIcon({ "aria-hidden": ariaHidden, focusable, ...props }: LucideProps) {
  return <MapPin {...props} aria-hidden={ariaHidden ?? true} focusable={focusable ?? false} />;
}
