"use client";

export const openLoginModal = (detail = {}) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("open-login-modal", {
      detail,
    }),
  );
};

