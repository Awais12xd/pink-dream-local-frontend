"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { SettingContext } from "../context/SettingContext";
import LoginModal from "./LoginModal";

const PROTECTION = {
  LOGIN_ONLY: "login_only",
  CHECKOUT_POLICY: "checkout_policy",
};

const ROUTE_POLICIES = [
  { prefix: "/checkout", mode: PROTECTION.CHECKOUT_POLICY },

  // Login-only routes
  { prefix: "/orders", mode: PROTECTION.LOGIN_ONLY },
  { prefix: "/profile", mode: PROTECTION.LOGIN_ONLY },
  { prefix: "/account", mode: PROTECTION.LOGIN_ONLY },

  // If you want product details protected by login, keep this:
  { prefix: "/product", mode: PROTECTION.LOGIN_ONLY },
];

const EXCLUDED_PREFIXES = ["/login", "/auth", "/admin"];

function getRoutePolicy(pathname) {
  if (!pathname) return null;

  const isExcluded = EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isExcluded) return null;

  return (
    ROUTE_POLICIES.find(
      (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
    ) || null
  );
}

export default function RouteGuardModel({ children }) {
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();
  const { cart, isLoading: cartLoading } = useCart();
  const { settings } = useContext(SettingContext);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const routePolicy = useMemo(() => getRoutePolicy(pathname), [pathname]);

  const shouldRequireLogin = useMemo(() => {
    if (!routePolicy) return false;

    if (routePolicy.mode === PROTECTION.LOGIN_ONLY) {
      return true;
    }

    if (routePolicy.mode === PROTECTION.CHECKOUT_POLICY) {
      // Prevent modal flash when checkout will redirect to cart anyway
      if (cartLoading) return false;
      if (!Array.isArray(cart) || cart.length === 0) return false;

      // Guest checkout rule from settings
      const allowGuestCheckout = settings?.allowGuestCheckout ?? true;
      return allowGuestCheckout === false;
    }

    return false;
  }, [routePolicy, cartLoading, cart, settings]);

  useEffect(() => {
    if (authLoading) return;
    setIsLoginModalOpen(shouldRequireLogin && !user);
  }, [authLoading, shouldRequireLogin, user]);

  return (
    <>
      {children}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onAuthSuccess={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
