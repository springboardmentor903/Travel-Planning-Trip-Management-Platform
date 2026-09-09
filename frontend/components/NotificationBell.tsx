"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { AppNotification } from "@/types";
import { Bell, Check, Loader2, UserPlus, UserCheck, UserX, Info, Calendar, Clock, AlertTriangle, RefreshCw } from "lucide-react";

import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount and polling
  const fetchUnreadCount = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    api.get("/notifications/unread-count")
      .then((res) => {
        if (res.data && typeof res.data.unreadCount === "number") {
          setUnreadCount(res.data.unreadCount);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll unread count every 15 seconds to ensure live updates without re-logging
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notification list when dropdown is opened
  const toggleDropdown = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState) {
      setLoading(true);
      api.get("/notifications")
        .then((res) => {
          if (Array.isArray(res.data)) {
            setNotifications(res.data);
            const count = res.data.filter((n: AppNotification) => !n.read).length;
            setUnreadCount(count);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  const handleMarkAsRead = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    api.patch(`/notifications/${id}/read`)
      .catch(() => {
        // Rollback on failure
        fetchUnreadCount();
      });
  };

  const handleNotificationItemClick = (n: AppNotification) => {
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      api.patch(`/notifications/${n.id}/read`).catch(() => fetchUnreadCount());
    }
    setIsOpen(false);

    // Administrator NEW_TRIP notification: mark read, close dropdown, no trip navigation
    if (n.type === "NEW_TRIP") {
      return;
    }

    // Trip-related notifications for owner/current members:
    if (
      n.tripId != null &&
      (
        n.type === "TRIP_REMINDER" ||
        n.type === "ACTIVITY_REMINDER" ||
        n.type === "BUDGET_ALERT" ||
        n.type === "TRAVEL_UPDATE" ||
        n.type === "MEMBER_ADDED" ||
        n.type === "JOIN_REQUEST" ||
        n.type === "JOIN_REQUEST_APPROVED" ||
        n.type === "JOIN_REQUEST_REJECTED"
      )
    ) {
      router.push(`/trips/${n.tripId}`);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "MEMBER_ADDED":
        return <UserPlus className="w-4 h-4 text-sky-600" />;
      case "JOIN_REQUEST":
        return <UserCheck className="w-4 h-4 text-amber-600" />;
      case "JOIN_REQUEST_APPROVED":
        return <Check className="w-4 h-4 text-emerald-600" />;
      case "JOIN_REQUEST_REJECTED":
        return <UserX className="w-4 h-4 text-red-500" />;
      case "TRIP_REMINDER":
        return <Calendar className="w-4 h-4 text-sky-600" />;
      case "ACTIVITY_REMINDER":
        return <Clock className="w-4 h-4 text-indigo-600" />;
      case "BUDGET_ALERT":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "TRAVEL_UPDATE":
        return <RefreshCw className="w-4 h-4 text-teal-600" />;
      case "NEW_TRIP":
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-sky-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-sky-100 hover:text-white hover:bg-sky-600 rounded-full transition flex items-center justify-center"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-xs border border-sky-800 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-2xl shadow-2xl border border-sky-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-sky-950">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>

          {/* Panel Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs italic">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationItemClick(n)}
                  className={`p-4 transition flex items-start gap-3 cursor-pointer ${
                    n.read
                      ? "bg-white hover:bg-slate-50/80"
                      : "bg-sky-50/60 hover:bg-sky-50 border-l-4 border-sky-500"
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-slate-100 shrink-0">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <h4 className={`text-xs ${n.read ? "font-semibold text-slate-700" : "font-extrabold text-sky-950"}`}>
                      {n.title || "Notification"}
                    </h4>
                    <p className={`text-[11px] leading-relaxed ${n.read ? "text-slate-500" : "text-slate-800 font-medium"}`}>
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium block pt-0.5">
                      {formatTimeAgo(n.createdAt)}
                    </span>
                  </div>

                  {!n.read && (
                    <button
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      className="text-[10px] text-sky-600 hover:text-sky-800 font-bold shrink-0 self-center"
                      title="Mark as read"
                    >
                      <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
