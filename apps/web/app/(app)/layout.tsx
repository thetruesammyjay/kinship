import AppGate from "@/components/shell/AppGate";
import AppShell from "@/components/shell/AppShell";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppGate>
      <AppShell>{children}</AppShell>
    </AppGate>
  );
}
