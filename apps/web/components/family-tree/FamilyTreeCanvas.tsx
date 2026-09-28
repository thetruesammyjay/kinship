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
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { PersonNode, type PersonGraphNode } from "./PersonNode";
import type { FamilyTreeEdge, FamilyTreeRead } from "@/lib/types";

type FamilyTreeCanvasProps = {
  tree: FamilyTreeRead | null;
};

const NODE_WIDTH = 184;
const NODE_HEIGHT = 82;
const nodeTypes = { person: PersonNode };
type RelationshipKind = "parent" | "spouse" | "sibling" | "other";
type FamilyTreeGraphEdge = Edge<{ relationshipType: string }>;

function relationshipPresentation(edge: FamilyTreeEdge): {
  source: string;
  target: string;
  label: string;
  kind: RelationshipKind;
  directed: boolean;
} {
  switch (edge.relationship_type) {
    case "CHILD_OF":
      return {
        source: edge.target,
        target: edge.source,
        label: "Parent to child",
        kind: "parent",
        directed: true,
      };
    case "PARENT_OF":
      return {
        source: edge.source,
        target: edge.target,
        label: "Parent to child",
        kind: "parent",
        directed: true,
      };
    case "MARRIED_TO":
      return {
        source: edge.source,
        target: edge.target,
        label: "Spouse link",
        kind: "spouse",
        directed: false,
      };
    case "SIBLING_OF":
      return {
        source: edge.source,
        target: edge.target,
        label: "Sibling",
        kind: "sibling",
        directed: false,
      };
    default:
      return {
        source: edge.source,
        target: edge.target,
        label: edge.relationship_type.toLowerCase().replaceAll("_", " "),
        kind: "other",
        directed: true,
      };
  }
}

function buildGraph(tree: FamilyTreeRead): {
  nodes: PersonGraphNode[];
  edges: FamilyTreeGraphEdge[];
} {
  const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "TB",
    align: "UL",
    nodesep: 54,
    ranksep: 96,
    marginx: 36,
    marginy: 36,
  });

  for (const person of tree.nodes) {
    graph.setNode(person.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of tree.edges) {
    const display = relationshipPresentation(edge);
    if (display.kind === "parent") {
      graph.setEdge(display.source, display.target, {
        id: `${edge.source}-${edge.target}`,
      });
    }
  }

  dagre.layout(graph);

  const edges = tree.edges.map((edge, index) => {
    const display = relationshipPresentation(edge);
    const palette = {
      parent: { stroke: "#a52646", dash: undefined },
      spouse: { stroke: "#6d2d54", dash: "8 5" },
      sibling: { stroke: "#356d8b", dash: "2 5" },
      other: { stroke: "#68636d", dash: "5 5" },
    }[display.kind];
    const id = `${edge.source}-${edge.target}-${edge.relationship_type}-${index}`;
    const spouseEdge = display.kind === "spouse";
    const sourcePosition = graph.node(display.source);
    const targetPosition = graph.node(display.target);
    const deltaX = targetPosition.x - sourcePosition.x;
    const deltaY = targetPosition.y - sourcePosition.y;
    const useHorizontalSpouseHandles = Math.abs(deltaX) >= Math.abs(deltaY);
    const sourceHandle = useHorizontalSpouseHandles
      ? deltaX >= 0
        ? "spouse-source-right"
        : "spouse-source-left"
      : deltaY >= 0
        ? "spouse-source-bottom"
        : "spouse-source-top";
    const targetHandle = useHorizontalSpouseHandles
      ? deltaX >= 0
        ? "spouse-target-left"
        : "spouse-target-right"
      : deltaY >= 0
        ? "spouse-target-top"
        : "spouse-target-bottom";

    return {
      id,
      source: display.source,
      target: display.target,
      type: spouseEdge ? "smoothstep" : "step",
      sourceHandle: spouseEdge ? sourceHandle : "relationship-source",
      targetHandle: spouseEdge ? targetHandle : "relationship-target",
      label: display.label,
      data: { relationshipType: edge.relationship_type },
      markerEnd: display.directed
        ? { type: MarkerType.ArrowClosed, width: 16, height: 16, color: palette.stroke }
        : undefined,
      style: {
        stroke: palette.stroke,
        strokeWidth: spouseEdge ? 3.2 : 2.5,
        strokeDasharray: palette.dash,
        strokeLinecap: "round",
      },
      labelStyle: { fill: "#31272b", fontSize: 11, fontWeight: 700 },
      labelBgStyle: { fill: "#ffffff", fillOpacity: 1 },
      labelBgPadding: [7, 5] as [number, number],
      labelBgBorderRadius: 5,
    } satisfies FamilyTreeGraphEdge;
  });

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
        familyName: person.family_name,
        isFocusFamily: person.is_focus_family,
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    } satisfies Node;
  }) as PersonGraphNode[];

  return { nodes, edges };
}

export function FamilyTreeCanvas({ tree }: FamilyTreeCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  useEffect(() => {
    setSelectedId(null);
    setSelectedEdgeId(null);
  }, [tree?.family_id]);
  const graph = useMemo(() => (tree ? buildGraph(tree) : null), [tree]);
  const selectedNode = graph?.nodes.find((node) => node.id === selectedId);
  const selectedEdge = graph?.edges.find((edge) => edge.id === selectedEdgeId);
  const selectedRelationships = tree?.edges.filter(
    (edge) => edge.source === selectedId || edge.target === selectedId,
  );
  const selectedNeighborIds = new Set<string>(selectedId ? [selectedId] : []);
  for (const edge of selectedRelationships ?? []) {
    selectedNeighborIds.add(edge.source);
    selectedNeighborIds.add(edge.target);
  }
  const selectedEdgeNeighbors = new Set(
    selectedEdge ? [selectedEdge.source, selectedEdge.target] : [],
  );
  const selectedEdgePeople = selectedEdge
    ? [
        tree?.nodes.find((person) => person.id === selectedEdge.source),
        tree?.nodes.find((person) => person.id === selectedEdge.target),
      ]
    : [];
  const verifyHref = selectedEdge
    ? `/verify?${new URLSearchParams({
        person_a_id: selectedEdge.source,
        person_b_id: selectedEdge.target,
      }).toString()}`
    : null;

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
        nodes={graph.nodes.map((node) => ({
          ...node,
          selected: selectedEdge
            ? selectedEdgeNeighbors.has(node.id)
            : node.id === selectedId,
          style: {
            ...node.style,
            opacity: selectedEdge
              ? selectedEdgeNeighbors.has(node.id)
                ? 1
                : 0.2
              : !selectedId || selectedNeighborIds.has(node.id)
                ? 1
                : 0.24,
          },
        }))}
        edges={graph.edges.map((edge) => {
          const isSelectedConnection =
            selectedEdge != null && edge.id === selectedEdge.id;
          const isHighlightedConnection = selectedEdge
            ? isSelectedConnection
            : Boolean(selectedId) &&
              (edge.source === selectedId || edge.target === selectedId);
          const hasSelection = Boolean(selectedEdge || selectedId);
          return {
            ...edge,
            label: isSelectedConnection ? edge.label : undefined,
            labelStyle: {
              ...edge.labelStyle,
              opacity: isSelectedConnection ? 1 : 0,
            },
            style: {
              ...edge.style,
              opacity: !hasSelection || isHighlightedConnection ? 1 : 0.12,
              strokeWidth: isHighlightedConnection ? 4.2 : edge.style?.strokeWidth,
            },
          };
        })}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.22, maxZoom: 1.2 }}
        minZoom={0.25}
        maxZoom={1.8}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={(_, node) => {
          setSelectedEdgeId(null);
          setSelectedId(node.id);
        }}
        onEdgeClick={(_, edge) => {
          setSelectedId(null);
          setSelectedEdgeId(edge.id);
        }}
        onPaneClick={() => {
          setSelectedId(null);
          setSelectedEdgeId(null);
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#eadde1" />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          className="graph-minimap"
          position="bottom-right"
          nodeColor={(node) =>
            (node.data as { isFocusFamily?: boolean }).isFocusFamily
              ? "#ff5a76"
              : "#7894a4"
          }
          nodeStrokeColor="#251216"
          nodeStrokeWidth={2}
          pannable
          zoomable
        />
        <Panel position="top-left" className="graph-legend">
          <span><i className="parent-line" />Parent to child</span>
          <span><i className="spouse-line" />Spouse link</span>
          <span><i className="sibling-line" />Sibling link</span>
          <span><i className="other-line" />Other recorded link</span>
          <span><i className="external-family" />Connected family</span>
          <small>Select a connection line to inspect its pair. Select a person to highlight direct links.</small>
        </Panel>
        {selectedEdge && (
          <Panel position="top-right" className="graph-detail graph-edge-detail">
            <button
              type="button"
              aria-label="Close connection details"
              onClick={() => setSelectedEdgeId(null)}
            >
              <X size={15} />
            </button>
            <span>Recorded connection</span>
            <strong>{selectedEdge.label}</strong>
            <small>
              {selectedEdgePeople[0]?.label ?? "Person"} and {selectedEdgePeople[1]?.label ?? "Person"}
            </small>
            {verifyHref && (
              <Link href={verifyHref} className="graph-verify-link">
                Verify this pair <ArrowUpRight size={15} />
              </Link>
            )}
          </Panel>
        )}
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
            <small>
              {selectedNode.data.isFocusFamily ? "Selected family" : "Connected family"}: {" "}
              {selectedNode.data.familyName ?? "Family not recorded"}
            </small>
            <small>{selectedRelationships?.length ?? 0} recorded relationships</small>
          </Panel>
        )}
      </ReactFlow>
    </section>
  );
}
