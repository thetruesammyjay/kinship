import { useMemo, useState } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);

  return useMemo(
    () => ({
      isAuthenticated: Boolean(token),
      token,
      setToken,
      logout: () => setToken(null),
    }),
    [token],
  );
}
