import { apiRequest } from "@/lib/api";
import type { FamilyRead, FamilyTreeRead, PersonRead, PersonSearchResult } from "@/lib/types";

export type FamilyOption = {
  id: string;
  name: string;
  originCommunity: string | null;
  clanId: string | null;
  memberCount: number;
};

export type RegistryData = {
  people: PersonRead[];
  families: FamilyOption[];
};

export async function loadRegistryData(): Promise<RegistryData> {
  const [result, familyRecords] = await Promise.all([
    apiRequest<PersonSearchResult>("/persons/search"),
    apiRequest<FamilyRead[]>("/families"),
  ]);
  const peopleByFamily = new Map<string, PersonRead[]>();

  for (const person of result.items) {
    if (!person.family_id) continue;
    const members = peopleByFamily.get(person.family_id) ?? [];
    members.push(person);
    peopleByFamily.set(person.family_id, members);
  }

  const families = familyRecords.map((family) => ({
    id: family.id,
    name: family.family_name,
    originCommunity: family.origin_community,
    clanId: family.clan_id,
    memberCount: peopleByFamily.get(family.id)?.length ?? 0,
  } satisfies FamilyOption));

  families.sort((left, right) => left.name.localeCompare(right.name));
  return { people: result.items, families };
}

export function filterTreeByFamily(
  tree: FamilyTreeRead,
  people: PersonRead[],
  familyId: string,
): FamilyTreeRead {
  const memberIds = new Set(
    people.filter((person) => person.family_id === familyId).map((person) => person.id),
  );

  return {
    family_id: familyId,
    nodes: tree.nodes.filter((node) => memberIds.has(node.id)),
    edges: tree.edges.filter(
      (edge) => memberIds.has(edge.source) && memberIds.has(edge.target),
    ),
  };
}
