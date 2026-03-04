"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import NotificationToast from "../admin/components/NotificationToast";
import { adminFetch } from "../utils/adminApi";
import { getStoredStaffUser, getCurrentStaffId } from "../utils/staffAuth";

const NotificationContext = createContext(null);
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const PREF_KEY_PREFIX = "staff:realtime-notifications";

const getPrefKey = (staffId) => `${PREF_KEY_PREFIX}:${staffId}`;

const readRealtimePref = (staffId) => {
  if (!staffId) return true;
  const raw = localStorage.getItem(getPrefKey(staffId));
  if (raw === null) return true; // default ON
  return raw === "1";
};

const writeRealtimePref = (staffId, enabled) => {
  if (!staffId) return;
  localStorage.setItem(getPrefKey(staffId), enabled ? "1" : "0");
};

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [authVersion, setAuthVersion] = useState(0);
  const [prefsVersion, setPrefsVersion] = useState(0);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    const onAuthChange = () => setAuthVersion((v) => v + 1);
    const onPrefChange = () => setPrefsVersion((v) => v + 1);

    window.addEventListener("staff-auth-changed", onAuthChange);
    window.addEventListener("staff-realtime-notifications-changed", onPrefChange);

    const onStorage = (e) => {
      if (e.key === "staffUserData" || e.key === "staffUserToken") onAuthChange();
      if (e.key && e.key.startsWith(`${PREF_KEY_PREFIX}:`)) onPrefChange();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("staff-auth-changed", onAuthChange);
      window.removeEventListener("staff-realtime-notifications-changed", onPrefChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const staffUser = getStoredStaffUser();
    const staffId = getCurrentStaffId(staffUser);

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (!staffUser) {
      setItems([]);
      setUnreadCount(0);
      setRealtimeEnabled(true);
      return;
    }

    const enabled = readRealtimePref(staffId);
    setRealtimeEnabled(enabled);

    if (!enabled) {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    const loadHistory = async () => {
      try {
        const res = await adminFetch(`${API_BASE}/admin/notifications?limit=50`);
        const data = await res.json();

        if (data.success) {
          const list = data.items || [];
          setItems(list);

          const unread = list.filter(
            (n) => !(n.readBy || []).some((id) => String(id) === String(staffId)),
          ).length;

          setUnreadCount(unread);
        }
      } catch (e) {
        console.error("Failed to load notifications history", e);
      }
    };

    loadHistory();

    socketRef.current = io(API_BASE, { withCredentials: true });

    socketRef.current.on("notification:new", (notif) => {
      setItems((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);

      if (notif.severity === "high" || notif.severity === "critical") {
        toast(
          <NotificationToast
            title={notif.title}
            message={notif.message}
            severity={notif.severity}
          />,
          {
            position: "bottom-right",
            className: "Toastify__toast--notif",
            bodyClassName: "p-0",
            closeButton: true,
            progressClassName: "bg-red-400",
          },
        );
      }
    });

    return () => socketRef.current?.disconnect();
  }, [authVersion, prefsVersion]);

  const setRealtimeEnabledForCurrentStaff = (enabled) => {
    const staffId = getCurrentStaffId();
    if (!staffId) return;

    writeRealtimePref(staffId, enabled);
    setRealtimeEnabled(enabled);

    if (!enabled) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setItems([]);
      setUnreadCount(0);
    } else {
      setPrefsVersion((v) => v + 1); // reconnect + fetch history
    }

    window.dispatchEvent(new Event("staff-realtime-notifications-changed"));
  };

  const value = {
    items,
    setItems,
    unreadCount,
    setUnreadCount,
    realtimeEnabled,
    setRealtimeEnabledForCurrentStaff,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return ctx;
}
