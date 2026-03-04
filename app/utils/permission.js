// lib/permissions.js
import { hasStaffPermission } from "./staffAuth";

export function computePermissions(roles = []) {
  // roles: [{ name, permissions: [...] }]
  const perms = new Set();
  roles.forEach(r => (r.permissions || []).forEach(p => perms.add(p)));
  return perms;
}

export function hasPermission(staffUser, permission) {
  return hasStaffPermission(staffUser, permission);
}
