import { useEffect, useRef, useState } from "react";

export function FpsOverlay(): JSX.Element {
  const [fps, setFps] = useState<string>("--");
  const rafId = useRef<number>(0);
  const frameCount = useRef(0);
  const lastTime = useRef(0);

  useEffect(() => {
    if (typeof requestAnimationFrame === "undefined") {
      return;
    }

    lastTime.current = performance.now();
    frameCount.current = 0;

    const tick = (now: number) => {
      frameCount.current++;
      const elapsed = now - lastTime.current;

      if (elapsed >= 500) {
        setFps(Math.round((frameCount.current * 1000) / elapsed).toString());
        frameCount.current = 0;
        lastTime.current = now;
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      data-testid="fps-overlay"
      style={{
        position: "fixed",
        top: 8,
        right: 8,
        padding: "4px 8px",
        background: "rgba(0, 0, 0, 0.6)",
        color: "#fff",
        fontFamily: "monospace",
        fontSize: 12,
        borderRadius: 4,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {fps} FPS
    </div>
  );
}
