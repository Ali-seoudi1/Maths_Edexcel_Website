"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  listNotifications,
  markAllNotificationsRead,
  markDisplayedNotificationsRead,
  markNotificationRead,
  notificationsChangedEvent,
} from "../services/notification-service";
import type { StudentNotification } from "../types";

function relativeTime(value: string | null) {
  if (!value) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 172_800) return "Yesterday";

  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(value));
}

export function NotificationBell() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobilePanelStyle, setMobilePanelStyle] = useState<CSSProperties | undefined>();

  const loadNotifications = useCallback(async () => {
    try {
      const result = await listNotifications({ limit: 5 });
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();

    function handleChanged() {
      void loadNotifications();
    }

    window.addEventListener(notificationsChangedEvent, handleChanged);
    return () => window.removeEventListener(notificationsChangedEvent, handleChanged);
  }, [loadNotifications]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!open || loading) {
      return;
    }

    const displayedUnreadIds = notifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id);

    if (displayedUnreadIds.length === 0) {
      return;
    }

    setUnreadCount((current) => Math.max(0, current - displayedUnreadIds.length));
    setNotifications((current) =>
      current.map((notification) =>
        displayedUnreadIds.includes(notification.id) ? { ...notification, read: true } : notification,
      ),
    );
    void markDisplayedNotificationsRead(displayedUnreadIds);
  }, [loading, notifications, open]);

  useEffect(() => {
    if (!open) {
      setMobilePanelStyle(undefined);
      return;
    }

    function updatePanelPosition() {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setMobilePanelStyle(undefined);
        return;
      }

      const viewport = window.visualViewport;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const offsetLeft = viewport?.offsetLeft ?? 0;
      const offsetTop = viewport?.offsetTop ?? 0;

      setMobilePanelStyle({
        left: `${offsetLeft + 16}px`,
        right: "auto",
        top: `${offsetTop + 96}px`,
        width: `${Math.max(280, Math.min(viewportWidth - 32, 384))}px`,
        maxHeight: `${Math.max(280, viewportHeight - 128)}px`,
      });
    }

    updatePanelPosition();

    const viewport = window.visualViewport;
    window.addEventListener("resize", updatePanelPosition);
    viewport?.addEventListener("resize", updatePanelPosition);
    viewport?.addEventListener("scroll", updatePanelPosition);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      viewport?.removeEventListener("resize", updatePanelPosition);
      viewport?.removeEventListener("scroll", updatePanelPosition);
    };
  }, [open]);

  async function handleNotificationClick(notification: StudentNotification) {
    if (!notification.read) {
      await markNotificationRead(notification.id);
      setUnreadCount((current) => Math.max(0, current - 1));
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
      );
    }

    setOpen(false);
    router.push(notification.link);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative h-11 w-11 rounded-xl bg-card shadow-soft"
        aria-label="Open notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-5 text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          className="fixed left-4 right-4 top-24 z-50 flex max-h-[calc(100dvh-8rem-env(safe-area-inset-bottom))] flex-col overflow-hidden rounded-xl border bg-card shadow-lg md:absolute md:left-auto md:right-0 md:top-14 md:w-96 md:max-w-sm"
          style={mobilePanelStyle}
        >
          <div className="flex items-center justify-between gap-3 border-b p-4">
            <p className="font-semibold text-foreground">Notifications</p>
            <button
              type="button"
              className="text-xs font-semibold text-primary disabled:text-muted-foreground"
              onClick={() => void handleMarkAllRead()}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto md:max-h-96">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No new notifications</p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={cn(
                    "block w-full border-b p-4 text-left transition-colors last:border-b-0 hover:bg-secondary/40",
                    !notification.read && "bg-primary/5",
                  )}
                  onClick={() => void handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {!notification.read ? <span className="mt-2 h-2 w-2 rounded-full bg-primary" /> : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs font-medium text-muted-foreground">
                        {relativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            className="block border-t p-4 text-center text-sm font-semibold text-primary hover:bg-secondary/40"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}
