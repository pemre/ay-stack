import type { ResponsiveLayouts } from "react-grid-layout";

export const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: "sidebar", x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 2 },
    { i: "content", x: 3, y: 0, w: 5, h: 8, minW: 2, minH: 2 },
    { i: "map", x: 8, y: 0, w: 4, h: 8, minW: 2, minH: 2 },
    { i: "timeline", x: 0, y: 8, w: 12, h: 4, minW: 2, minH: 2 },
  ],
  md: [
    { i: "sidebar", x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 2 },
    { i: "content", x: 3, y: 0, w: 4, h: 8, minW: 2, minH: 2 },
    { i: "map", x: 7, y: 0, w: 3, h: 8, minW: 2, minH: 2 },
    { i: "timeline", x: 0, y: 8, w: 10, h: 4, minW: 2, minH: 2 },
  ],
  sm: [
    { i: "sidebar", x: 0, y: 0, w: 6, h: 4, minW: 2, minH: 2 },
    { i: "content", x: 0, y: 4, w: 6, h: 6, minW: 2, minH: 2 },
    { i: "map", x: 0, y: 10, w: 6, h: 5, minW: 2, minH: 2 },
    { i: "timeline", x: 0, y: 15, w: 6, h: 4, minW: 2, minH: 2 },
  ],
  xs: [
    { i: "sidebar", x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 2 },
    { i: "content", x: 0, y: 4, w: 4, h: 6, minW: 2, minH: 2 },
    { i: "map", x: 0, y: 10, w: 4, h: 5, minW: 2, minH: 2 },
    { i: "timeline", x: 0, y: 15, w: 4, h: 4, minW: 2, minH: 2 },
  ],
  xxs: [
    { i: "sidebar", x: 0, y: 0, w: 2, h: 4, minW: 2, minH: 2 },
    { i: "content", x: 0, y: 4, w: 2, h: 6, minW: 2, minH: 2 },
    { i: "map", x: 0, y: 10, w: 2, h: 5, minW: 2, minH: 2 },
    { i: "timeline", x: 0, y: 15, w: 2, h: 4, minW: 2, minH: 2 },
  ],
};
