import type { LucideProps } from "lucide-react";
import { Github } from "lucide-react";

export function GithubIcon({ "aria-hidden": ariaHidden, focusable, ...props }: LucideProps) {
  return <Github {...props} aria-hidden={ariaHidden ?? true} focusable={focusable ?? false} />;
}
