"use client";

import dagre from "@dagrejs/dagre";
import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MarkerType,
  MiniMap,
  type Node,
  Panel,
  Position,
  ReactFlow,
} from "@xyflow/react";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { PersonNode, type PersonGraphNode } from "./PersonNode";
import type { FamilyTreeEdge, FamilyTreeRead } from "@/lib/types";

type FamilyTreeCanvasProps = {
  tree: FamilyTreeRead | null;
};

const NODE_WIDTH = 184;
const NODE_HEIGHT = 72;
const nodeTypes = { person: PersonNode };

function relationshipPresentation(edge: FamilyTreeEdge) {
  switch (edge.relationship_type) {
    case "CHILD_OF":
      return { source: edge.target, target: edge.source, label: "parent", directed: true };
    case "PARENT_OF":
      return { source: edge.source, target: edge.target, label: "parent", directed: true };
    case "MARRIED_TO":
      return { source: edge.source, target: edge.target, label: "spouse", directed: false };
    case "SIBLING_OF":
      return { source: edge.source, target: edge.target, label: "sibling", directed: false };
    default:
      return {
        source: edge.source,
        target: edge.target,
        label: edge.relationship_type.toLowerCase().replaceAll("_", " "),
        directed: true,
      };
  }
}

function buildGraph(tree: FamilyTreeRead): { nodes: PersonGraphNode[]; edges: Edge[] } {
  const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "TB",
    align: "UL",
    nodesep: 42,
    ranksep: 86,
    marginx: 36,
    marginy: 36,
  });

  const connectionCount = new Map<string, number>();
  for (const edge of tree.edges) {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) ?? 0) + 1);
    connectionCount.set(edge.target, (connectionCount.get(edge.target) ?? 0) + 1);
  }

  for (const person of tree.nodes) {
    graph.setNode(person.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  const edges = tree.edges.map((edge, index) => {
    const display = relationshipPresentation(edge);
    const id = `${edge.source}-${edge.target}-${edge.relationship_type}-${index}`;
    graph.setEdge(display.source, display.target, { id });
    const isSpouse = display.label === "spouse";
    return {
      id,
      source: display.source,
      target: display.target,
      type: "smoothstep",
      label: display.label,
      markerEnd: display.directed
        ? { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "#d81e4a" }
        : undefined,
      style: {
        stroke: isSpouse ? "#c57a12" : "#d81e4a",
        strokeWidth: 2,
        strokeDasharray: isSpouse ? "6 4" : undefined,
      },
      labelStyle: { fill: "#493a40", fontSize: 11, fontWeight: 800 },
      labelBgStyle: { fill: "#ffffff", fillOpacity: 0.94 },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 6,
    } satisfies Edge;
  });

  dagre.layout(graph);

  const nodes = tree.nodes.map((person) => {
    const position = graph.node(person.id) ?? { x: NODE_WIDTH / 2, y: NODE_HEIGHT / 2 };
    return {
      id: person.id,
      type: "person",
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
      data: {
        name: person.label,
        connectionCount: connectionCount.get(person.id) ?? 0,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    } satisfies Node;
  }) as PersonGraphNode[];

  return { nodes, edges };
}

export function FamilyTreeCanvas({ tree }: FamilyTreeCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const graph = useMemo(() => (tree ? buildGraph(tree) : null), [tree]);
  const selectedNode = graph?.nodes.find((node) => node.id === selectedId);
  const selectedRelationships = tree?.edges.filter(
    (edge) => edge.source === selectedId || edge.target === selectedId,
  );

  if (!tree || tree.nodes.length === 0 || !graph) {
    return (
      <section className="tree-empty" aria-label="Family tree visualization">
        <strong>No people in this family yet</strong>
        <span>Register a person to begin the lineage graph.</span>
      </section>
    );
  }

  return (
    <section className="graph-shell" aria-label="Interactive family tree visualization">
      <ReactFlow
        key={tree.family_id}
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.22, maxZoom: 1.2 }}
        minZoom={0.25}
        maxZoom={1.8}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={(_, node) => setSelectedId(node.id)}
        onPaneClick={() => setSelectedId(null)}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#eadde1" />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          className="graph-minimap"
          position="bottom-right"
          nodeColor="#ff5a76"
          nodeStrokeColor="#251216"
          nodeStrokeWidth={2}
          pannable
          zoomable
        />
        <Panel position="top-left" className="graph-legend">
          <span><i className="parent-line" />Parent</span>
          <span><i className="spouse-line" />Spouse</span>
        </Panel>
        {selectedNode && (
          <Panel position="top-right" className="graph-detail">
            <button
              type="button"
              aria-label="Close person details"
              onClick={() => setSelectedId(null)}
            >
              <X size={15} />
            </button>
            <span>Selected person</span>
            <strong>{selectedNode.data.name}</strong>
            <small>{selectedRelationships?.length ?? 0} recorded relationships</small>
          </Panel>
        )}
      </ReactFlow>
    </section>
  );
}
