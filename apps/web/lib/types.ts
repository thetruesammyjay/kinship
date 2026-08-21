/**
 * Types mirroring the FastAPI Pydantic schemas (apps/api/app/schemas/*).
 * Field names stay snake_case — the API serializes them that way.
 */

export type PersonRead = {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  gender: string;
  date_of_birth: string | null;
  is_deceased: boolean;
  clan_id: string | null;
  family_id: string | null;
  origin_community: string | null;
  notes: string | null;
};

export type PersonSearchResult = {
  items: PersonRead[];
  total: number;
};

export type FamilyRead = {
  id: string;
  family_name: string;
  origin_community: string | null;
  clan_id: string | null;
};

export type ClanRead = {
  id: string;
  clan_name: string;
  region: string | null;
};

export type RelationshipRead = {
  source_person_id: string;
  target_person_id: string;
  relationship_type: string;
  confidence_score: number;
};

export type KinshipStatus = "Unrelated" | "Distantly Related" | "Closely Related";

export type RelationshipPathStep = {
  person_id: string;
  full_name: string;
};

export type KinshipVerifyResponse = {
  status: KinshipStatus;
  degree: number | null;
  common_ancestor_id: string | null;
  path: RelationshipPathStep[];
  message: string;
};

export type FamilyTreeNode = {
  id: string;
  label: string;
  kind?: string;
};

export type FamilyTreeEdge = {
  source: string;
  target: string;
  relationship_type: string;
};

export type FamilyTreeRead = {
  family_id: string;
  nodes: FamilyTreeNode[];
  edges: FamilyTreeEdge[];
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type UserRead = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: string;
  is_active: boolean;
};

export type UserRole = "Admin" | "Registrar" | "Elder" | "User";

export type AdminUser = UserRead & {
  created_at: string;
};

export type DisputeStatus = "open" | "under_review" | "resolved" | "rejected";

export type DisputeRead = {
  id: string;
  submitted_by: string;
  entity_type: "person" | "family" | "relationship";
  entity_id: string;
  reason: string;
  status: DisputeStatus;
  resolution_notes: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditLogRead = {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
};

export type AccuracySummary = {
  total_tests: number;
  correct_detections: number;
  accuracy: number;
};

export type PerformanceSummary = {
  samples: number;
  average_ms: number;
  max_ms: number;
};

export type SusSummary = {
  responses: number;
  average_score: number;
  interpretation: string;
};

export type SusSubmissionRead = {
  score: number;
  interpretation: string;
};
