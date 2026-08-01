import { apiRequest } from "./client";

export function verifyKinship(personAId: string, personBId: string) {
  return apiRequest("/kinship/verify", {
    method: "POST",
    body: JSON.stringify({
      person_a_id: personAId,
      person_b_id: personBId,
    }),
  });
}
