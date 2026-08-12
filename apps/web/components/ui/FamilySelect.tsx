import type { FamilyOption } from "@/lib/registry";

type FamilySelectProps = {
  families: FamilyOption[];
  value: string;
  onChange: (familyId: string) => void;
  disabled?: boolean;
  label?: string;
};

export function FamilySelect({
  families,
  value,
  onChange,
  disabled = false,
  label = "Family",
}: FamilySelectProps) {
  return (
    <label className="field">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required
      >
        <option value="">{families.length ? "Select a family" : "No families available"}</option>
        {families.map((family) => (
          <option key={family.id} value={family.id}>
            {family.name}
            {family.originCommunity ? ` - ${family.originCommunity}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
