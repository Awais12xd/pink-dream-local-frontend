"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const getUrl = (input) => {
  if (!input) return API_BASE;
  if (/^https?:\/\//i.test(input)) return input;
  if (input.startsWith("/")) return `${API_BASE}${input}`;
  return `${API_BASE}/${input}`;
};

const cleanHeaders = (headers) => {
  const normalized = new Headers(headers || {});
  const authHeader = normalized.get("Authorization");
  if (
    !authHeader ||
    !authHeader.trim() ||
    /^Bearer\s*(null|undefined)?\s*$/i.test(authHeader.trim())
  ) {
    normalized.delete("Authorization");
  }

  return normalized;
};

export const adminFetch = (input, options = {}) => {
  const url = getUrl(input);

  return fetch(url, {
    ...options,
    credentials: "include",
    headers: cleanHeaders(options.headers),
  });
};
