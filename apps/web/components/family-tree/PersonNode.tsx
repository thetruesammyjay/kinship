import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { UserRound } from "lucide-react";

export type PersonGraphNode = Node<
  { name: string; connectionCount: number },
  "person"
>;

export function PersonNode({ data, selected }: NodeProps<PersonGraphNode>) {
  return (
    <div className={`graph-person${selected ? " selected" : ""}`}>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <span className="graph-person-icon"><UserRound size={17} /></span>
      <span className="graph-person-copy">
        <strong>{data.name}</strong>
        <small>{data.connectionCount} relationships</small>
      </span>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}
