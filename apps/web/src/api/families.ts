import { apiRequest } from "./client";

export function getFamilyTree(familyId: string) {
  return apiRequest(`/families/${familyId}/tree`);
}
