"use client";

const STAFF_USER_STORAGE_KEY = "staffUserData";
const LEGACY_STAFF_TOKEN_KEY = "staffUserToken";

const safeParse = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const getStoredStaffUser = () => {
  if (typeof window === "undefined") return null;
  return safeParse(localStorage.getItem(STAFF_USER_STORAGE_KEY));
};

export const setStoredStaffUser = (staffUser) => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_STAFF_TOKEN_KEY);
  if (!staffUser) {
    localStorage.removeItem(STAFF_USER_STORAGE_KEY);
    return;
  }
  localStorage.setItem(STAFF_USER_STORAGE_KEY, JSON.stringify(staffUser));
};

export const clearStoredStaffAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STAFF_USER_STORAGE_KEY);
  // Clean legacy token key during migration
  localStorage.removeItem(LEGACY_STAFF_TOKEN_KEY);
};

export const hasStaffPermission = (staffUser, permission) => {
  if (!permission) return true;
  if (!staffUser) return false;
  if (staffUser.isProtected) return true;

  const permissions = Array.isArray(staffUser.permissions)
    ? staffUser.permissions
    : [];

  return permissions.includes("*") || permissions.includes(permission);
};

export const getCurrentStaffId = (staffUser = null) => {
  const source = staffUser || getStoredStaffUser();
  return String(source?.id || source?._id || "");
};
