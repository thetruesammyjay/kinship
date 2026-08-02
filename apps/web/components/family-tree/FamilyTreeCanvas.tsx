"use client";

import { useMemo } from "react";
import { PersonNode } from "./PersonNode";
import { RelationshipEdge } from "./RelationshipEdge";
import type { FamilyTreeRead } from "@/lib/types";

type FamilyTreeCanvasProps = {
  tree: FamilyTreeRead | null;
};

/**
 * Renders the lineage graph as stacked edge rows (source → relationship →
 * target). A React Flow / D3 canvas can replace this later; the data shape
 * (nodes + edges from GET /families/{id}/tree) already supports it.
 */
export function FamilyTreeCanvas({ tree }: FamilyTreeCanvasProps) {
  const labelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of tree?.nodes ?? []) map.set(node.id, node.label);
    return map;
  }, [tree]);

  if (!tree || tree.edges.length === 0) {
    return (
      <section className="tree-canvas" aria-label="Family tree visualization">
        <div className="tree-row centered">
          <PersonNode name="No edges recorded yet" label="Lineage graph" tone="black" />
        </div>
        <RelationshipEdge label="link parents and spouses to grow the tree" />
      </section>
    );
  }

  return (
    <section className="tree-canvas" aria-label="Family tree visualization">
      {tree.edges.map((edge, index) => (
        <div key={`${edge.source}-${edge.target}-${index}`} style={{ display: "grid", gap: 10 }}>
          <div className="tree-row">
            <PersonNode
              name={labelById.get(edge.source) ?? "Unknown"}
              label="Source"
              tone={index % 2 === 0 ? "pink" : "white"}
            />
            <PersonNode
              name={labelById.get(edge.target) ?? "Unknown"}
              label="Target"
              tone={index % 2 === 0 ? "white" : "black"}
            />
          </div>
          <RelationshipEdge label={edge.relationship_type} />
        </div>
      ))}
    </section>
  );
}
