import { useState } from "react";

import type { KinshipResult } from "../types";

export function useKinshipVerification() {
  const [result, setResult] = useState<KinshipResult | null>(null);

  function runDemoVerification() {
    setResult({
      status: "Distantly Related",
      degree: 3,
      path: ["Elder Nnamdi Worlu", "Adaeze Worlu", "Amara Worlu"],
      message: "Shared ancestor found through the Worlu lineage.",
    });
  }

  return { result, runDemoVerification };
}
