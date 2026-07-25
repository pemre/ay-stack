import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import "./Button.css";

interface ButtonAsButton extends ComponentPropsWithoutRef<"button"> {
  variant?: "icon" | "text";
  href?: never;
  target?: never;
  rel?: never;
}

interface ButtonAsAnchor extends ComponentPropsWithoutRef<"a"> {
  variant?: "icon" | "text";
  href: string;
  disabled?: boolean;
}

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

export function Button(props: ButtonProps) {
  const { variant = "icon", children, className, ...rest } = props;
  const classes = ["btn", variant === "text" ? "btn--text" : "btn--icon", className]
    .filter(Boolean)
    .join(" ");

  if (rest.href != null) {
    const { disabled, onClick, href, ...anchorRest } = rest as Omit<
      ButtonAsAnchor,
      "variant" | "children" | "className"
    > & { disabled?: boolean };
    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };
    return (
      <a
        href={href}
        className={classes}
        aria-disabled={disabled ? "true" : undefined}
        onClick={handleClick}
        {...anchorRest}
      >
        {children}
      </a>
    );
  }

  const buttonRest = rest as Omit<ButtonAsButton, "variant" | "children" | "className">;
  return (
    <button type="button" className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
