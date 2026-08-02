/**
 * Thin fetch wrapper for the FastAPI backend (apps/api). Base URL comes from
 * NEXT_PUBLIC_API_BASE_URL and already includes the /api/v1 prefix. A stored
 * JWT (see lib/session.tsx) is attached as a Bearer token — endpoints are
 * public today, but the header is correct once the API adds auth guards.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const SESSION_KEY = "kinship.session.v1";

export class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function storedToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = storedToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    // The API's ApiError handler returns {"detail": {"message": ...}} or
    // {"detail": "..."} — surface whichever message is present.
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      const detail = body?.detail ?? body?.message;
      if (typeof detail === "string") message = detail;
      else if (typeof detail?.message === "string") message = detail.message;
    } catch {
      // non-JSON error body; keep the generic message
    }
    throw new ApiRequestError(response.status, message);
  }

  return response.json() as Promise<T>;
}
