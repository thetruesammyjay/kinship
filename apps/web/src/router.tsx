import type { AppView } from "./types";
import { AdminEvaluation } from "./pages/AdminEvaluation";
import { Dashboard } from "./pages/Dashboard";
import { FamilyTreePage } from "./pages/FamilyTreePage";
import { RegisterPerson } from "./pages/RegisterPerson";
import { VerifyEligibility } from "./pages/VerifyEligibility";

type AppRouterProps = {
  view: AppView;
};

export function AppRouter({ view }: AppRouterProps) {
  if (view === "register") return <RegisterPerson />;
  if (view === "tree") return <FamilyTreePage />;
  if (view === "verify") return <VerifyEligibility />;
  if (view === "evaluation") return <AdminEvaluation />;
  return <Dashboard />;
}
