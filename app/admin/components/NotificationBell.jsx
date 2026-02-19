"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff, Check, Loader2 } from "lucide-react";
import { useNotifications } from "@/app/context/NotificationContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const formatTime = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60) return "just now";
  if (min < 60) return `${min} min${min > 1 ? "s" : ""} ago`;
  if (hr < 24) return `${hr} hour${hr > 1 ? "s" : ""} ago`;
  if (day < 7) return `${day} day${day > 1 ? "s" : ""} ago`;

  const week = Math.floor(day / 7);
  if (week < 5) return `${week} week${week > 1 ? "s" : ""} ago`;

  const month = Math.floor(day / 30);
  if (month < 12) return `${month} month${month > 1 ? "s" : ""} ago`;

  const year = Math.floor(day / 365);
  return `${year} year${year > 1 ? "s" : ""} ago`;
};

export default function NotificationBell({ onViewAll }) {
  const {
    items,
    unreadCount,
    setItems,
    setUnreadCount,
    realtimeEnabled,
    setRealtimeEnabledForCurrentStaff,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [markingIds, setMarkingIds] = useState([]);
  const ref = useRef(null);

  const staffId = useMemo(() => {
    try {
      const staff = JSON.parse(localStorage.getItem("staffUserData") || "null");
      return String(staff?.id || "");
    } catch {
      return "";
    }
  }, []);

  const latest = useMemo(() => items.slice(0, 4), [items]);
  const badge = unreadCount > 99 ? "99+" : unreadCount;

  const isRead = (n) =>
    (n.readBy || []).some((id) => String(id) === String(staffId));

  const latestUnreadCount = useMemo(
    () => latest.filter((n) => !isRead(n)).length,
    [latest, staffId],
  );

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markNotificationsRead = async (ids = []) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length || !staffId) return;

    const toChangeCount = items.filter(
      (n) => uniqueIds.includes(n._id) && !isRead(n),
    ).length;
    if (toChangeCount === 0) return;

    setMarkingIds((prev) => Array.from(new Set([...prev, ...uniqueIds])));

    try {
      const token = localStorage.getItem("staffUserToken");
      const res = await fetch(`${API_BASE}/admin/notifications/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: uniqueIds }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.message || "Failed to mark notification as read");
      }

      setItems((prev) =>
        prev.map((n) => {
          if (!uniqueIds.includes(n._id)) return n;
          const alreadyRead = (n.readBy || []).some(
            (id) => String(id) === String(staffId),
          );
          if (alreadyRead) return n;
          return { ...n, readBy: [...(n.readBy || []), staffId] };
        }),
      );

      setUnreadCount((c) => Math.max(0, c - toChangeCount));
    } catch (err) {
      console.error("Notification mark-read failed:", err);
    } finally {
      setMarkingIds((prev) => prev.filter((id) => !uniqueIds.includes(id)));
    }
  };

  const markAllLatestUnread = () => {
    const unreadIds = latest.filter((n) => !isRead(n)).map((n) => n._id);
    markNotificationsRead(unreadIds);
  };

  return (
    <div className="relative z-50" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-pink-50 transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-pink-600" />
        {realtimeEnabled && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[18rem] sm:w-[22rem] bg-white shadow-xl border border-pink-100 rounded-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-white">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  Notifications
                </div>
                <div className="text-xs text-gray-500">
                  Latest 4 • {latestUnreadCount} unread
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setRealtimeEnabledForCurrentStaff(!realtimeEnabled)
                  }
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold border ${
                    realtimeEnabled
                      ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  }`}
                  title={
                    realtimeEnabled
                      ? "Pause realtime notifications"
                      : "Resume realtime notifications"
                  }
                >
                  {realtimeEnabled ? "Pause realtime notifications" : "Resume realtime notifications"}
                </button>
              </div>
            </div>
          </div>

          {!realtimeEnabled ? (
            <div className="px-4 py-6 text-sm text-gray-600">
              <div className="flex items-center gap-2 mb-1">
                <BellOff className="w-4 h-4 text-gray-500" />
                Realtime notifications are paused for your account.
              </div>
              <div className="text-xs text-gray-500">
                Open the Notifications tab to check updates manually.
              </div>
            </div>
          ) : latest.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500">
              No notifications yet.
            </div>
          ) : // existing list render
            latest.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500">
              No notifications yet.
            </div>
          ) : (
            <div className="max-h-80 overflow-auto">
              {latest.map((n) => {
                const read = isRead(n);
                const isMarking = markingIds.includes(n._id);

                return (
                  <div
                    key={n._id}
                    className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                      read
                        ? "bg-white"
                        : "bg-pink-50/60 border-l-2 border-l-pink-500"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className={`text-sm font-medium truncate ${
                              read ? "text-gray-700" : "text-gray-900"
                            }`}
                          >
                            {n.title}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                              read
                                ? "bg-gray-100 text-gray-500"
                                : "bg-pink-100 text-pink-700"
                            }`}
                          >
                            {read ? "Read" : "Unread"}
                          </span>
                        </div>

                        {n.message && (
                          <div
                            className={`text-xs mt-0.5 line-clamp-2 ${
                              read ? "text-gray-500" : "text-gray-700"
                            }`}
                          >
                            {n.message}
                          </div>
                        )}

                        <div className="text-[11px] text-gray-400 mt-1">
                          {formatTime(n.createdAt)}
                        </div>
                      </div>

                      {!read && (
                        <button
                          onClick={() => markNotificationsRead([n._id])}
                          disabled={isMarking}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                          title="Mark as read"
                        >
                          {isMarking ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-4 py-3 border-t border-pink-100 bg-white">
            <button
              onClick={() => {
                setOpen(false);
                onViewAll?.();
              }}
              className="text-sm text-pink-600 font-semibold hover:text-pink-700"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
