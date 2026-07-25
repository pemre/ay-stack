import type { ResponsiveLayouts } from "react-grid-layout";

export const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: [
    { i: "tree-list", x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 2 },
    { i: "markdown-viewer", x: 3, y: 0, w: 5, h: 8, minW: 2, minH: 2 },
    { i: "geo-map", x: 8, y: 0, w: 4, h: 8, minW: 2, minH: 2 },
    { i: "linear-timeline", x: 0, y: 8, w: 12, h: 4, minW: 2, minH: 2 },
  ],
  md: [
    { i: "tree-list", x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 2 },
    { i: "markdown-viewer", x: 3, y: 0, w: 4, h: 8, minW: 2, minH: 2 },
    { i: "geo-map", x: 7, y: 0, w: 3, h: 8, minW: 2, minH: 2 },
    { i: "linear-timeline", x: 0, y: 8, w: 10, h: 4, minW: 2, minH: 2 },
  ],
  sm: [
    { i: "tree-list", x: 0, y: 0, w: 6, h: 4, minW: 2, minH: 2 },
    { i: "markdown-viewer", x: 0, y: 4, w: 6, h: 6, minW: 2, minH: 2 },
    { i: "geo-map", x: 0, y: 10, w: 6, h: 5, minW: 2, minH: 2 },
    { i: "linear-timeline", x: 0, y: 15, w: 6, h: 4, minW: 2, minH: 2 },
  ],
  xs: [
    { i: "tree-list", x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 2 },
    { i: "markdown-viewer", x: 0, y: 4, w: 4, h: 6, minW: 2, minH: 2 },
    { i: "geo-map", x: 0, y: 10, w: 4, h: 5, minW: 2, minH: 2 },
    { i: "linear-timeline", x: 0, y: 15, w: 4, h: 4, minW: 2, minH: 2 },
  ],
  xxs: [
    { i: "tree-list", x: 0, y: 0, w: 2, h: 4, minW: 2, minH: 2 },
    { i: "markdown-viewer", x: 0, y: 4, w: 2, h: 6, minW: 2, minH: 2 },
    { i: "geo-map", x: 0, y: 10, w: 2, h: 5, minW: 2, minH: 2 },
    { i: "linear-timeline", x: 0, y: 15, w: 2, h: 4, minW: 2, minH: 2 },
  ],
};
