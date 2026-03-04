"use client";

import { getStoredStaffUser } from "../utils/staffAuth";
import { hasPermission } from "../utils/permission";

export default function Authorized({ permission, children, fallback = null }) {
  if (!permission) return children;

  const staffUser = getStoredStaffUser();
  return hasPermission(staffUser, permission) ? children : fallback;
}
