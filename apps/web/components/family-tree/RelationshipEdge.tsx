type RelationshipEdgeProps = {
  label: string;
};

export function RelationshipEdge({ label }: RelationshipEdgeProps) {
  return <div className="relationship-edge">{label}</div>;
}
