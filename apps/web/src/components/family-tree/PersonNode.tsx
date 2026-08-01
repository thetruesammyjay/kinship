type PersonNodeProps = {
  name: string;
  label: string;
  tone?: "pink" | "black" | "white";
};

export function PersonNode({ name, label, tone = "white" }: PersonNodeProps) {
  return (
    <div className={`person-node ${tone}`}>
      <span>{label}</span>
      <strong>{name}</strong>
    </div>
  );
}
