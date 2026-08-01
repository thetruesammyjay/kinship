type RelationshipPathProps = {
  path: string[];
};

export function RelationshipPath({ path }: RelationshipPathProps) {
  const steps = path.length ? path : ["Select Person A", "Run verification", "Review path"];

  return (
    <div className="path-strip">
      {steps.map((step, index) => (
        <span key={step}>
          <b>{String(index + 1).padStart(2, "0")}</b>
          {step}
        </span>
      ))}
    </div>
  );
}
