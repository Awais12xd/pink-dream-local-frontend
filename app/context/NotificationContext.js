"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import NotificationToast from "../admin/components/NotificationToast";

const NotificationContext = createContext(null);
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [authVersion, setAuthVersion] = useState(0);
  const socketRef = useRef(null);

  // listen for auth changes
  useEffect(() => {
    const onAuthChange = () => setAuthVersion((v) => v + 1);

    window.addEventListener("staff-auth-changed", onAuthChange);

    // optional: handle cross-tab changes
    const onStorage = (e) => {
      if (e.key === "staffUserToken" || e.key === "staffUserData") {
        onAuthChange();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("staff-auth-changed", onAuthChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("staffUserToken");
    const staffUser = JSON.parse(
      localStorage.getItem("staffUserData") || "null",
    );

    // Always reset on auth change
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (!token || !staffUser) {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/notifications?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success) {
          setItems(data.items);
          const unread = data.items.filter(
            (n) => !(n.readBy || []).includes(staffUser.id),
          ).length;
          setUnreadCount(unread);
        }
      } catch (e) {
        console.error("Failed to load notifications history", e);
      }
    };

    loadHistory();

    socketRef.current = io(API_BASE, { auth: { token } });

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
            className: "Toastify__toast--notif",
            bodyClassName: "p-0",
            closeButton: true,
            progressClassName: "bg-red-400"
          },
        );
      }
    });

    return () => socketRef.current?.disconnect();
  }, [authVersion]);

  const value = { items, setItems, unreadCount, setUnreadCount };
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  return ctx;
}
