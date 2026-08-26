"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from "firebase/firestore";
import { Bell, ShieldAlert, MessageSquare, CheckCircle, Package } from "lucide-react";

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "ESCROW_LOCKED" | "ESCROW_DELIVERED" | "NEW_MESSAGE" | "DISPUTE_RAISED" | "ORDER_COMPLETED";
  orderId?: string;
  read: boolean;
  createdAt: any;
}

export default function NotificationDropdown({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real-time Firestore listener for notifications
  useEffect(() => {
    
    if (!userId) return;
    
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    ); 

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
      setNotifications(docs);
    }, (error) => {
      console.error("Error fetching notifications:", error);
    });

    return () => unsubscribe();
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "ESCROW_LOCKED":
        return <Package className="w-4 h-4 text-amber-400" />;
      case "ESCROW_DELIVERED":
        return <Package className="w-4 h-4 text-blue-400" />;
      case "NEW_MESSAGE":
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case "DISPUTE_RAISED":
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case "ORDER_COMPLETED":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[10px] font-bold text-zinc-950 items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-100 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                {unreadCount} Unread
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-900">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs">
                No notifications yet.
              </div>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.orderId ? "/orders/" + item.orderId : "#"}
                  onClick={() => {
                    if (!item.read) markAsRead(item.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-start gap-3 p-3.5 transition hover:bg-zinc-900/60 ${
                    !item.read ? "bg-zinc-900/30" : "opacity-75"
                  }`}
                >
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-zinc-200 truncate">
                        {item.title}
                      </p>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                      {item.message}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
