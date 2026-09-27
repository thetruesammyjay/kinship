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
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <span className="graph-person-icon"><UserRound size={17} /></span>
      <span className="graph-person-copy">
        <strong>{data.name}</strong>
        <small title={familyLabel}>{familyLabel}</small>
      </span>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}
