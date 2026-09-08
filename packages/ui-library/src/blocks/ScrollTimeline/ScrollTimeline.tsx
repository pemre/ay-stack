import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ScrollTimelineConfig, ScrollTimelineLabels, ScrollTimelineProps } from "./types.ts";
import { DEFAULT_SCROLL_TIMELINE_LABELS } from "./types.ts";
import "./ScrollTimeline.css";

interface MergedConfig {
  labels: Required<ScrollTimelineLabels>;
  navWidth: number;
  minViewportWidth: number;
  alwaysShowLabels: boolean;
}

function mergeConfig(user?: ScrollTimelineConfig, labels?: ScrollTimelineLabels): MergedConfig {
  return {
    labels: { ...DEFAULT_SCROLL_TIMELINE_LABELS, ...labels },
    navWidth: user?.navWidth ?? 130,
    minViewportWidth: user?.minViewportWidth ?? 1024,
    alwaysShowLabels: user?.alwaysShowLabels ?? false,
  };
}

interface TimelineItem {
  /** Position as a fraction of total content height (0–1). */
  offset: number;
  label: string;
  id: string;
}

/**
 * Vertical scroll-progress timeline, reverse-engineered from ai-2027.com.
 *
 * Renders a sticky SVG nav on the left that draws a progress line growing as
 * the user scrolls, with milestone dots that fill once scrolled past and
 * labels that appear on hover (or permanently when configured).
 *
 * The component is fully prop-driven: it reads milestone positions from child
 * elements marked with `data-timeline-id` and `data-timeline-label`.
 */
export function ScrollTimeline({
  sections: _sections,
  namePrefix = "narrative",
  config,
  labels,
  className = "",
  children,
}: ScrollTimelineProps) {
  const cfg = useMemo(() => mergeConfig(config, labels), [config, labels]);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isWideEnough, setIsWideEnough] = useState(true);

  const contentRef = useRef<HTMLElement | null>(null);
  const tocRef = useRef<HTMLDivElement | null>(null);

  /**
   * Recompute dot positions, scroll progress, and active section.
   * Called on scroll, resize, and after a rAF delay on mount.
   */
  const recompute = useCallback(() => {
    const container = contentRef.current;
    if (!container) return;

    // 1 — overall scroll progress (0→1), clamped
    if (tocRef.current) {
      const top = container.offsetTop;
      const height = container.offsetHeight;
      if (height > 0) {
        const p = Math.max(
          0,
          Math.min((window.scrollY + window.innerHeight / 2 - top) / height, 1),
        );
        setScrollProgress(p);
        tocRef.current.style.setProperty("--scrollPosition", String(p));
      }
    }

    // 2 — active section: last marker above viewport center
    const markers = container.querySelectorAll<HTMLElement>("[data-timeline-id]");
    let active: string | null = null;
    for (const el of markers) {
      if (el.getBoundingClientRect().top < window.innerHeight / 2) {
        active = el.getAttribute("data-timeline-id");
      }
    }
    if (active) setActiveId(active);

    // 3 — compute dot positions as % of content height
    const containerTop = container.offsetTop;
    const containerHeight = container.offsetHeight || 1;
    const items: TimelineItem[] = [];
    for (const el of markers) {
      const offset = (el.offsetTop - containerTop) / containerHeight;
      // Skip items with invalid positions (not yet laid out)
      if (Number.isFinite(offset) && offset >= 0) {
        items.push({
          offset,
          label: el.getAttribute("data-timeline-label") ?? "",
          id: el.getAttribute("data-timeline-id") ?? "",
        });
      }
    }
    // Only update if we found valid items (avoid overwriting with empty on first render)
    if (items.length > 0) {
      setTimelineItems(items);
    }
  }, []);

  // Scroll listener — attaches to window for iframe compatibility
  useEffect(() => {
    // Defer first computation until after paint so DOM has real dimensions
    const rafId = requestAnimationFrame(() => {
      // Double rAF: first frame paints, second frame has measured layout
      requestAnimationFrame(recompute);
    });

    const handler = () => recompute();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [recompute]);

  // ResizeObserver — recompute when content height changes (images loading, etc.)
  useEffect(() => {
    const container = contentRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    let rafId: number | undefined;
    const observer = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(recompute);
    });
    observer.observe(container);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [recompute]);

  // Viewport width check
  useEffect(() => {
    function checkWidth() {
      setIsWideEnough(window.innerWidth >= cfg.minViewportWidth);
    }
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, [cfg.minViewportWidth]);

  if (!isWideEnough) {
    return (
      <section ref={contentRef} className={`scroll-timeline-content ${className}`}>
        {children}
      </section>
    );
  }

  return (
    <div className={`scroll-timeline ${className}`}>
      {/* timeline nav */}
      <div ref={tocRef} className="scroll-timeline-nav" style={{ width: `${cfg.navWidth}px` }}>
        <nav className="scroll-timeline-nav-inner" aria-label={cfg.labels.ariaLabel}>
          <svg
            width={cfg.navWidth}
            style={{
              height: "calc(100vh - 4px)",
              opacity: scrollProgress * 100 > 2 ? 1 : 0,
            }}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="scroll-timeline-svg"
            aria-hidden="true"
          >
            {/* progress line */}
            <line
              x1="3"
              y1="8"
              x2="3"
              y2={`${Math.max(scrollProgress * 100, 2)}%`}
              className="scroll-timeline-line"
            />
            {/* dots + labels */}
            {timelineItems.map((item) => {
              const passed = item.offset <= scrollProgress;
              const isActive = item.id === activeId;
              return (
                <g key={item.id} transform={`translate(0, ${97 * item.offset}%)`}>
                  <circle cx="3" cy="6" r="3" className="scroll-timeline-dot-outer" />
                  <circle
                    cx="3"
                    cy="6"
                    r="2"
                    fill={passed ? "transparent" : "var(--scroll-timeline-dot-inner)"}
                  />
                  {item.label && (
                    <text
                      x="12"
                      y="11"
                      width="200"
                      height="20"
                      className={`scroll-timeline-label ${isActive ? "scroll-timeline-label--active" : ""} ${cfg.alwaysShowLabels ? "scroll-timeline-label--visible" : ""}`}
                    >
                      <a className="scroll-timeline-link" href={`#${namePrefix}-${item.id}`}>
                        {item.label}
                      </a>
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </nav>
      </div>

      {/* content */}
      <section ref={contentRef} className="scroll-timeline-content">
        {children}
      </section>
    </div>
  );
}
