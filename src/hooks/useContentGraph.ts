import { useMemo } from "react";
import contentGraph from "virtual:burkut-content";
import type { ContentGraph, ContentIndex } from "../shared/types.ts";
import { contentGraphToLegacyIndex, getContentBody } from "../cli/contentGraph.ts";

export function useContentGraph() {
    const graph: ContentGraph = useMemo(() => contentGraph, []);
    const legacyIndex: ContentIndex = useMemo(() => contentGraphToLegacyIndex(graph), [graph]);
    const getContent = useMemo(() => (id: string) => getContentBody(graph, id), [graph]);
    return { graph, legacyIndex, getContent };
}
