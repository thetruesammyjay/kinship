import { apiRequest } from "./client";

export type PersonPayload = {
  full_name: string;
  email?: string;
  phone_number?: string;
  gender?: string;
  origin_community?: string;
  notes?: string;
};

export function createPerson(payload: PersonPayload) {
  return apiRequest("/persons", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function searchPeople(query = "") {
  return apiRequest(`/persons/search?q=${encodeURIComponent(query)}`);
}
