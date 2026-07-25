import type { DataNode } from "./types.ts";

export interface StressDataOptions {
  count: number;
  startYear: number;
  endYear: number;
}

const TYPES = ["history", "cinema", "literature", "science"] as const;

export function generateStressData(options: StressDataOptions): DataNode[] {
  const { count, startYear, endYear } = options;

  if (count <= 0 || startYear >= endYear) {
    return [];
  }

  const startMs = new Date(startYear, 0, 1).getTime();
  const endMs = new Date(endYear, 0, 1).getTime();
  const spanMs = endMs - startMs;

  const nodes: DataNode[] = [];

  for (let i = 0; i < count; i++) {
    const date = new Date(startMs + (spanMs * i) / count);
    const formatted = date.toISOString().slice(0, 10);

    nodes.push({
      id: `stress-${i}`,
      date,
      type: TYPES[i % TYPES.length],
      title: `Node ${i}`,
      content: `Generated node ${i} — ${formatted}`,
    });
  }

  return nodes;
}
