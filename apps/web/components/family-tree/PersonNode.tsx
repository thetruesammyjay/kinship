import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { UserRound } from "lucide-react";

export type PersonGraphNode = Node<
  {
    name: string;
    familyName: string | null;
    isFocusFamily: boolean;
  },
  "person"
>;

export function PersonNode({ data, selected }: NodeProps<PersonGraphNode>) {
  const familyLabel = data.isFocusFamily
    ? "Selected family"
    : data.familyName ?? "Family not recorded";
  return (
    <div
      className={
        `graph-person ${data.isFocusFamily ? "focus-family" : "external-family"}` +
        (selected ? " selected" : "")
      }
    >
      <Handle
        type="source"
        id="spouse-source-left"
        position={Position.Left}
        isConnectable={false}
        className="graph-spouse-handle"
      />
      <Handle
        type="target"
        id="spouse-target-left"
        position={Position.Left}
        isConnectable={false}
        className="graph-spouse-handle"
      />
      <Handle
        type="source"
        id="spouse-source-right"
        position={Position.Right}
        isConnectable={false}
        className="graph-spouse-handle"
      />
      <Handle
        type="target"
        id="spouse-target-right"
        position={Position.Right}
        isConnectable={false}
        className="graph-spouse-handle"
      />
      <Handle
        type="source"
        id="spouse-source-top"
        position={Position.Top}
        isConnectable={false}
        className="graph-spouse-handle"
      />
      <Handle
        type="target"
        id="spouse-target-top"
        position={Position.Top}
        isConnectable={false}
        className="graph-spouse-handle"
      />
      <Handle
        type="source"
        id="spouse-source-bottom"
        position={Position.Bottom}
        isConnectable={false}
        className="graph-spouse-handle"
      />
      <Handle
        type="target"
        id="spouse-target-bottom"
        position={Position.Bottom}
        isConnectable={false}
        className="graph-spouse-handle"
      />
      <Handle
        type="target"
        id="relationship-target"
        position={Position.Top}
        isConnectable={false}
      />
      <span className="graph-person-icon"><UserRound size={17} /></span>
      <span className="graph-person-copy">
        <strong>{data.name}</strong>
        <small title={familyLabel}>{familyLabel}</small>
      </span>
      <Handle
        type="source"
        id="relationship-source"
        position={Position.Bottom}
        isConnectable={false}
      />
    </div>
  );
}
