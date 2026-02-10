"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/app/context/NotificationContext";

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
  const { items, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const latest = items.slice(0, 4);
  const badge = unreadCount > 99 ? "99+" : unreadCount;

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative z-50" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-pink-50 transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-pink-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 sm:w-80 bg-white shadow-xl border border-pink-100 rounded-xl z-50">
          <div className="px-4 py-3 border-b border-pink-100">
            <div className="text-sm font-semibold text-gray-800">Notifications</div>
            <div className="text-xs text-gray-500">Latest 4 updates</div>
          </div>

          {latest.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-500">
              No notifications yet.
            </div>
          ) : (
            <div className="max-h-72 overflow-auto">
              {latest.map((n) => (
                <div key={n._id} className="px-4 py-3 hover:bg-pink-50">
                  <div className="text-sm font-medium text-gray-800">{n.title}</div>
                  {n.message && (
                    <div className="text-xs text-gray-600 line-clamp-2">
                      {n.message}
                    </div>
                  )}
                  <div className="text-[11px] text-gray-400">
                    {formatTime(n.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-3 border-t border-pink-100">
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
