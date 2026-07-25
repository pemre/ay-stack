import { render } from "@testing-library/react";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { Button } from "./Button.tsx";

/**
 * Property-based tests for the Button primitive.
 * Each test validates a correctness property from the design document.
 */

describe("Button property tests", () => {
  /**
   * Feature: header-design-system, Property 1: Element type determined by href
   *
   * For any set of valid Button props, if `href` is provided the rendered root
   * element should be an `<a>` tag, and if `href` is absent the rendered root
   * element should be a `<button>` tag with `type="button"`.
   *
   * Validates: Requirements 3.1, 4.1
   */
  it("renders <a> when href is present and <button type='button'> when absent", () => {
    fc.assert(
      fc.property(
        fc.record({
          href: fc.option(fc.webUrl(), { nil: undefined }),
          ariaLabel: fc.string({ minLength: 1, maxLength: 30 }),
        }),
        ({ href, ariaLabel }) => {
          const { container, unmount } = render(
            href !== undefined ? (
              <Button href={href} aria-label={ariaLabel}>
                content
              </Button>
            ) : (
              <Button aria-label={ariaLabel}>content</Button>
            ),
          );

          const root = container.firstElementChild;
          expect(root).not.toBeNull();

          if (href !== undefined) {
            expect(root?.tagName).toBe("A");
            expect(root?.getAttribute("href")).toBe(href);
          } else {
            expect(root?.tagName).toBe("BUTTON");
            expect(root?.getAttribute("type")).toBe("button");
          }

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: header-design-system, Property 2: Variant determines CSS class
   *
   * For any Button rendered with variant "icon" or "text" (or no variant,
   * defaulting to "icon"), and regardless of whether it renders as `<button>`
   * or `<a>`, the root element should have the CSS class `btn--icon` when
   * variant is "icon" (or omitted) and `btn--text` when variant is "text".
   * The base class `btn` should always be present.
   *
   * Validates: Requirements 3.2, 3.3, 3.4, 4.3
   */
  it("applies btn base class and correct variant class for any variant and href combination", () => {
    fc.assert(
      fc.property(
        fc.record({
          variant: fc.constantFrom("icon" as const, "text" as const, undefined),
          href: fc.option(fc.webUrl(), { nil: undefined }),
          ariaLabel: fc.string({ minLength: 1, maxLength: 30 }),
        }),
        ({ variant, href, ariaLabel }) => {
          const variantProp = variant !== undefined ? { variant } : {};
          const { container, unmount } = render(
            href !== undefined ? (
              <Button href={href} aria-label={ariaLabel} {...variantProp}>
                content
              </Button>
            ) : (
              <Button aria-label={ariaLabel} {...variantProp}>
                content
              </Button>
            ),
          );

          const root = container.firstElementChild;
          expect(root).not.toBeNull();

          // Base class is always present
          expect(root?.classList.contains("btn")).toBe(true);

          // Variant class matches: "icon" or undefined → btn--icon, "text" → btn--text
          if (variant === "text") {
            expect(root?.classList.contains("btn--text")).toBe(true);
            expect(root?.classList.contains("btn--icon")).toBe(false);
          } else {
            expect(root?.classList.contains("btn--icon")).toBe(true);
            expect(root?.classList.contains("btn--text")).toBe(false);
          }

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: header-design-system, Property 3: Attribute forwarding preserves all props
   *
   * For any combination of `aria-label`, `title`, `aria-expanded`, `aria-pressed`,
   * `disabled`, and `className` props passed to Button, each provided attribute
   * should appear on the rendered DOM element with the exact value that was passed.
   *
   * Validates: Requirements 3.6, 3.7, 3.9, 12.4
   */
  it("forwards aria-label, title, aria-expanded, aria-pressed, disabled, and className to the DOM element", () => {
    fc.assert(
      fc.property(
        fc.record({
          ariaLabel: fc.string({ minLength: 1, maxLength: 30 }),
          title: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
          ariaExpanded: fc.option(fc.boolean(), { nil: undefined }),
          ariaPressed: fc.option(fc.boolean(), { nil: undefined }),
          disabled: fc.option(fc.boolean(), { nil: undefined }),
          className: fc.option(
            fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9_-]{0,19}$/).filter((s) => s.length >= 1),
            { nil: undefined },
          ),
        }),
        ({ ariaLabel, title, ariaExpanded, ariaPressed, disabled, className }) => {
          const { container, unmount } = render(
            <Button
              aria-label={ariaLabel}
              title={title}
              aria-expanded={ariaExpanded}
              aria-pressed={ariaPressed}
              disabled={disabled}
              className={className}
            >
              content
            </Button>,
          );

          const el = container.firstElementChild as HTMLButtonElement;

          // aria-label is always provided
          expect(el.getAttribute("aria-label")).toBe(ariaLabel);

          // title forwarded when provided
          if (title !== undefined) {
            expect(el.getAttribute("title")).toBe(title);
          } else {
            expect(el.hasAttribute("title")).toBe(false);
          }

          // aria-expanded forwarded as string when provided
          if (ariaExpanded !== undefined) {
            expect(el.getAttribute("aria-expanded")).toBe(String(ariaExpanded));
          } else {
            expect(el.hasAttribute("aria-expanded")).toBe(false);
          }

          // aria-pressed forwarded as string when provided
          if (ariaPressed !== undefined) {
            expect(el.getAttribute("aria-pressed")).toBe(String(ariaPressed));
          } else {
            expect(el.hasAttribute("aria-pressed")).toBe(false);
          }

          // disabled on button element
          if (disabled) {
            expect(el.disabled).toBe(true);
          } else {
            expect(el.disabled).toBe(false);
          }

          // className merged with internal classes
          expect(el.classList.contains("btn")).toBe(true);
          if (className !== undefined) {
            expect(el.classList.contains(className)).toBe(true);
          }

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: header-design-system, Property 4: Anchor-specific attributes forwarded
   *
   * For any Button rendered with an `href` prop, the `href`, `target`, and `rel`
   * attributes should all be forwarded to the rendered `<a>` element with their
   * exact provided values.
   *
   * Validates: Requirements 4.2
   */
  it("forwards href, target, and rel to the rendered <a> element", () => {
    fc.assert(
      fc.property(
        fc.record({
          href: fc.webUrl(),
          target: fc.constantFrom(
            "_blank" as const,
            "_self" as const,
            "_parent" as const,
            "_top" as const,
          ),
          rel: fc.option(fc.constantFrom("noreferrer", "noopener", "noreferrer noopener"), {
            nil: undefined,
          }),
          ariaLabel: fc.string({ minLength: 1, maxLength: 30 }),
        }),
        ({ href, target, rel, ariaLabel }) => {
          const { container, unmount } = render(
            <Button href={href} target={target} rel={rel} aria-label={ariaLabel}>
              content
            </Button>,
          );

          const el = container.firstElementChild as HTMLAnchorElement;

          // Must be an <a> element
          expect(el.tagName).toBe("A");

          // href forwarded exactly
          expect(el.getAttribute("href")).toBe(href);

          // target forwarded exactly
          expect(el.getAttribute("target")).toBe(target);

          // rel forwarded when provided
          if (rel !== undefined) {
            expect(el.getAttribute("rel")).toBe(rel);
          } else {
            expect(el.hasAttribute("rel")).toBe(false);
          }

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});
