import fc from "fast-check";
import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "./defaults.ts";
import { clampZoomLevel, computeTransformOrigin, zoomLevelClass } from "./ImageZoom.tsx";

// Feature: image-zoom-block, Property 1: Transform origin percentages are bounded 0–100

describe("computeTransformOrigin – Property 1: Transform origin percentages are bounded 0–100", () => {
  /**
   * Validates: Requirements 2.1, 11.2
   *
   * For any cursor position (clientX, clientY) that falls within the image's
   * bounding rectangle, the computed transform-origin x and y percentages
   * shall both be between 0 and 100 inclusive.
   */
  it("returns x and y both in [0, 100] for any cursor within the bounding rect", () => {
    const arbRectAndCursor = fc
      .record({
        left: fc.double({ min: -10000, max: 10000, noNaN: true, noDefaultInfinity: true }),
        top: fc.double({ min: -10000, max: 10000, noNaN: true, noDefaultInfinity: true }),
        width: fc.double({ min: 1, max: 10000, noNaN: true, noDefaultInfinity: true }),
        height: fc.double({ min: 1, max: 10000, noNaN: true, noDefaultInfinity: true }),
        /** Fraction along width for clientX: 0 = left edge, 1 = right edge */
        fx: fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        /** Fraction along height for clientY: 0 = top edge, 1 = bottom edge */
        fy: fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
      })
      .map(({ left, top, width, height, fx, fy }) => ({
        clientX: left + fx * width,
        clientY: top + fy * height,
        rect: {
          left,
          top,
          width,
          height,
          right: left + width,
          bottom: top + height,
          x: left,
          y: top,
          toJSON() {
            return this;
          },
        } as DOMRect,
      }));

    fc.assert(
      fc.property(arbRectAndCursor, ({ clientX, clientY, rect }) => {
        const result = computeTransformOrigin(clientX, clientY, rect);

        expect(result.x).toBeGreaterThanOrEqual(0);
        expect(result.x).toBeLessThanOrEqual(100);
        expect(result.y).toBeGreaterThanOrEqual(0);
        expect(result.y).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: image-zoom-block, Property 2: Zoom level clamping produces a supported value with correct class

describe("clampZoomLevel / zoomLevelClass – Property 2: Zoom level clamping produces a supported value with correct class", () => {
  /**
   * Validates: Requirements 2.2, 3.3, 3.4
   *
   * For any numeric zoomLevel input, clampZoomLevel shall return one of
   * [1.5, 2, 2.5, 3], and that value shall be the supported level with the
   * minimum absolute distance from the input (ties break upward).
   * Furthermore, zoomLevelClass applied to the clamped value shall return
   * the corresponding hover:scale-[N] Tailwind class.
   */
  const SUPPORTED: readonly [1.5, 2, 2.5, 3] = [1.5, 2, 2.5, 3];

  it("always returns a supported zoom level that is nearest to the input (ties break up), with a valid Tailwind class", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
        (input) => {
          const clamped = clampZoomLevel(input);

          // 1. Result must be one of the supported levels
          expect(SUPPORTED).toContain(clamped);

          // 2. Result must be the nearest supported level (ties break upward)
          const clampedDist = Math.abs(input - clamped);
          for (const level of SUPPORTED) {
            const dist = Math.abs(input - level);
            if (dist < clampedDist) {
              // No other level should be strictly closer
              expect(dist).not.toBeLessThan(clampedDist);
            }
            if (dist === clampedDist && level > clamped) {
              // If equidistant, clamped should have been the higher value
              expect(clamped).toBeGreaterThanOrEqual(level);
            }
          }

          // 3. zoomLevelClass must return a valid hover:scale-[N] class
          const cls = zoomLevelClass(clamped);
          expect(cls).toBe(`hover:scale-[${clamped}]`);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: image-zoom-block, Property 6: Config merge preserves defaults for unspecified fields

describe("Config merge – Property 6: Config merge preserves defaults for unspecified fields", () => {
  /**
   * Validates: Requirements 9.2
   *
   * For any partial ImageZoomConfig (where each field is independently
   * present or absent), merging with DEFAULT_CONFIG via shallow merge shall
   * produce a complete config where every field is defined: present fields
   * equal the user-provided value, absent fields equal the DEFAULT_CONFIG value.
   */
  it("merged config has all fields; user values override, defaults fill gaps", () => {
    const arbPartialConfig = fc.record(
      {
        zoomLevel: fc.double({ min: 0.1, max: 100, noNaN: true, noDefaultInfinity: true }),
        transitionDuration: fc.double({
          min: 0,
          max: 10000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
      },
      { requiredKeys: [] },
    );

    fc.assert(
      fc.property(arbPartialConfig, (partialConfig) => {
        const merged = { ...DEFAULT_CONFIG, ...partialConfig };

        // 1. Every field in DEFAULT_CONFIG must be defined in the merged result
        for (const key of Object.keys(DEFAULT_CONFIG) as Array<keyof typeof DEFAULT_CONFIG>) {
          expect(merged[key]).toBeDefined();
        }

        // 2. Present fields equal the user-provided value
        if ("zoomLevel" in partialConfig && partialConfig.zoomLevel !== undefined) {
          expect(merged.zoomLevel).toBe(partialConfig.zoomLevel);
        }
        if (
          "transitionDuration" in partialConfig &&
          partialConfig.transitionDuration !== undefined
        ) {
          expect(merged.transitionDuration).toBe(partialConfig.transitionDuration);
        }

        // 3. Absent fields equal the DEFAULT_CONFIG value
        if (!("zoomLevel" in partialConfig) || partialConfig.zoomLevel === undefined) {
          expect(merged.zoomLevel).toBe(DEFAULT_CONFIG.zoomLevel);
        }
        if (
          !("transitionDuration" in partialConfig) ||
          partialConfig.transitionDuration === undefined
        ) {
          expect(merged.transitionDuration).toBe(DEFAULT_CONFIG.transitionDuration);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: image-zoom-block, Property 3: Alt text is faithfully applied to the img element

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ImageZoom } from "./ImageZoom.tsx";

describe("ImageZoom – Property 3: Alt text is faithfully applied to the img element", () => {
  /**
   * Validates: Requirements 6.1, 11.3
   *
   * For any non-empty alt string, rendering ImageZoom with that alt prop
   * shall produce an <img> element whose alt attribute exactly equals the
   * provided string.
   */
  it("rendered img alt attribute exactly matches the provided alt prop", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (altText) => {
        render(<ImageZoom src="https://example.com/test.jpg" alt={altText} />);

        const img = screen.getByTestId("image-zoom-img");
        expect(img).toHaveAttribute("alt", altText);

        cleanup();
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: image-zoom-block, Property 4: Custom class names are applied without overriding internal classes

describe("ImageZoom – Property 4: Custom class names are applied without overriding internal classes", () => {
  /**
   * Validates: Requirements 7.1, 7.2, 7.3, 11.4
   *
   * For any valid className and imageClassName strings, the rendered container
   * element shall include both the provided className and the internal classes
   * (image-zoom, overflow-hidden, cursor-zoom-in), and the rendered <img>
   * element shall include both the provided imageClassName and the internal
   * Tailwind utility classes (w-full, h-full, transition-transform).
   */
  it("container and img include both custom and internal classes", () => {
    const arbClassName = fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/);

    fc.assert(
      fc.property(arbClassName, arbClassName, (customClass, customImgClass) => {
        render(
          <ImageZoom
            src="https://example.com/test.jpg"
            alt="test image"
            className={customClass}
            imageClassName={customImgClass}
          />,
        );

        const container = screen.getByTestId("image-zoom-container");
        expect(container.className).toContain("image-zoom");
        expect(container.className).toContain("overflow-hidden");
        expect(container.className).toContain("cursor-zoom-in");
        expect(container.className).toContain(customClass);

        const img = screen.getByTestId("image-zoom-img");
        expect(img.className).toContain("w-full");
        expect(img.className).toContain("h-full");
        expect(img.className).toContain("transition-transform");
        expect(img.className).toContain(customImgClass);

        cleanup();
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: image-zoom-block, Property 5: Transition duration is applied to the img element

describe("ImageZoom – Property 5: Transition duration is applied to the img element", () => {
  /**
   * Validates: Requirements 4.3
   *
   * For any positive integer transitionDuration, rendering ImageZoom with
   * that config value shall produce an <img> element whose class list
   * contains `duration-[{transitionDuration}ms]`.
   */
  it("img element has the correct duration class for any positive integer transitionDuration", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), (duration) => {
        render(
          <ImageZoom
            src="https://example.com/test.jpg"
            alt="test image"
            config={{ transitionDuration: duration }}
          />,
        );

        const img = screen.getByTestId("image-zoom-img");
        expect(img.className).toContain(`duration-[${duration}ms]`);

        cleanup();
      }),
      { numRuns: 100 },
    );
  });
});

import type { ImageZoomConfig } from "./types.ts";

describe("ImageZoom – Unit Tests", () => {
  afterEach(() => cleanup());

  // Requirement 1.1, 6.1, 11.1
  it("renders with src and alt, img has correct attributes", () => {
    render(<ImageZoom src="https://example.com/photo.jpg" alt="A photo" />);

    const img = screen.getByTestId("image-zoom-img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(img).toHaveAttribute("alt", "A photo");
  });

  // Requirement 1.3, 11.5
  it("renders placeholder when src is empty", () => {
    render(<ImageZoom src="" alt="Missing image" />);

    expect(screen.getByTestId("image-zoom-placeholder")).toBeInTheDocument();
    expect(screen.queryByTestId("image-zoom-img")).not.toBeInTheDocument();
  });

  // Requirement 6.3
  it("shows alt text as visible fallback when image fails to load", () => {
    render(<ImageZoom src="https://example.com/broken.jpg" alt="Broken image" />);

    const img = screen.getByTestId("image-zoom-img");
    fireEvent.error(img);

    expect(screen.getByTestId("image-zoom-fallback")).toBeInTheDocument();
    expect(screen.getByTestId("image-zoom-fallback")).toHaveTextContent("Broken image");
    expect(screen.queryByTestId("image-zoom-img")).not.toBeInTheDocument();
  });

  // Requirement 3.2, 2.2
  it("applies default zoom level hover:scale-[3] class when no config provided", () => {
    render(<ImageZoom src="https://example.com/photo.jpg" alt="Photo" />);

    const img = screen.getByTestId("image-zoom-img");
    expect(img.className).toContain("hover:scale-[3]");
  });

  // Requirement 3.3
  it.each([
    { level: 1.5, expected: "hover:scale-[1.5]" },
    { level: 2, expected: "hover:scale-[2]" },
    { level: 2.5, expected: "hover:scale-[2.5]" },
    { level: 3, expected: "hover:scale-[3]" },
  ])("applies $expected class for zoomLevel $level", ({ level, expected }) => {
    render(
      <ImageZoom src="https://example.com/photo.jpg" alt="Photo" config={{ zoomLevel: level }} />,
    );

    const img = screen.getByTestId("image-zoom-img");
    expect(img.className).toContain(expected);
  });

  // Requirement 4.2
  it("applies default transition duration-[300ms] class when no config provided", () => {
    render(<ImageZoom src="https://example.com/photo.jpg" alt="Photo" />);

    const img = screen.getByTestId("image-zoom-img");
    expect(img.className).toContain("duration-[300ms]");
  });

  // Requirement 6.2
  it("sets role='img' on container when alt is empty (decorative image)", () => {
    render(<ImageZoom src="https://example.com/photo.jpg" alt="" />);

    const container = screen.getByTestId("image-zoom-container");
    expect(container).toHaveAttribute("role", "img");
  });

  // Requirement 1.2
  it("container has overflow-hidden class", () => {
    render(<ImageZoom src="https://example.com/photo.jpg" alt="Photo" />);

    const container = screen.getByTestId("image-zoom-container");
    expect(container.className).toContain("overflow-hidden");
  });

  // Requirement 1.4
  it("container has cursor-zoom-in class", () => {
    render(<ImageZoom src="https://example.com/photo.jpg" alt="Photo" />);

    const container = screen.getByTestId("image-zoom-container");
    expect(container.className).toContain("cursor-zoom-in");
  });

  // Requirement 9.1
  it("DEFAULT_CONFIG has values for every ImageZoomConfig field", () => {
    const configKeys: (keyof ImageZoomConfig)[] = ["zoomLevel", "transitionDuration"];

    for (const key of configKeys) {
      expect(DEFAULT_CONFIG[key]).toBeDefined();
    }
  });
});
