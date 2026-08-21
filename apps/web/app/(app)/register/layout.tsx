import RoleGate from "@/components/shell/RoleGate";

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allowed={["Admin", "Registrar", "Elder"]}>{children}</RoleGate>;
}
