import type { TenantContext } from "./tenant";

export type Permission =
  // Organization
  | "org:manage"
  | "org:invite"
  | "org:billing"
  // People
  | "people:read"
  | "people:write"
  | "people:delete"
  // Groups
  | "groups:read"
  | "groups:write"
  | "groups:lead"
  // Services
  | "services:read"
  | "services:write"
  | "services:schedule"
  // Songs
  | "songs:read"
  | "songs:write"
  // Giving
  | "giving:read"
  | "giving:write"
  | "giving:give" // a member giving their own donation
  // Events
  | "events:read"
  | "events:write"
  | "checkin:operate"
  // Communication
  | "messages:read"
  | "messages:send"
  // Forms
  | "forms:read"
  | "forms:write"
  // Reports
  | "reports:read";

type Role = TenantContext["role"];

const PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    "org:manage","org:invite","org:billing",
    "people:read","people:write","people:delete",
    "groups:read","groups:write","groups:lead",
    "services:read","services:write","services:schedule",
    "songs:read","songs:write",
    "giving:read","giving:write","giving:give",
    "events:read","events:write","checkin:operate",
    "messages:read","messages:send",
    "forms:read","forms:write",
    "reports:read",
  ],
  ADMIN: [
    "org:invite",
    "people:read","people:write","people:delete",
    "groups:read","groups:write","groups:lead",
    "services:read","services:write","services:schedule",
    "songs:read","songs:write",
    "giving:read","giving:write","giving:give",
    "events:read","events:write","checkin:operate",
    "messages:read","messages:send",
    "forms:read","forms:write",
    "reports:read",
  ],
  STAFF: [
    "people:read","people:write",
    "groups:read","groups:write",
    "services:read","services:write","services:schedule",
    "songs:read","songs:write",
    "giving:read","giving:give",
    "events:read","events:write","checkin:operate",
    "messages:read","messages:send",
    "forms:read","forms:write",
    "reports:read",
  ],
  GROUP_LEADER: [
    "people:read",
    "groups:read","groups:lead",
    "services:read",
    "songs:read",
    "events:read",
    "giving:give",
    "forms:read",
  ],
  VOLUNTEER: [
    "people:read",
    "groups:read",
    "services:read",
    "songs:read",
    "events:read",
    "giving:give",
    "forms:read",
  ],
  MEMBER: [
    "groups:read",
    "events:read",
    "giving:give",
    "forms:read",
  ],
};

export function hasPermission(role: Role, perm: Permission): boolean {
  return PERMISSIONS[role].includes(perm);
}

export function requirePermission(
  ctx: TenantContext,
  perm: Permission,
): void {
  if (!hasPermission(ctx.role, perm)) {
    throw new Error(`FORBIDDEN: missing ${perm}`);
  }
}
