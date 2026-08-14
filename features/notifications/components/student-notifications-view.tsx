"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notification-service";
import type { StudentNotification } from "../types";

type Filter = "all" | "unread";

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function StudentNotificationsView() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void listNotifications({ unreadOnly: filter === "unread" })
      .then((result) => setNotifications(result.notifications))
      .finally(() => setLoading(false));
  }, [filter]);

  async function handleOpen(notification: StudentNotification) {
    if (!notification.read) {
      await markNotificationRead(notification.id);
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
      );
    }

    router.push(notification.link);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((current) =>
      filter === "unread" ? [] : current.map((notification) => ({ ...notification, read: true })),
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            type="button"
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
          >
            Unread
          </Button>
        </div>
        <Button type="button" variant="outline" onClick={() => void handleMarkAllRead()}>
          Mark all as read
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
          description="Your notification history will appear here."
          icon={<Bell className="h-8 w-8" aria-hidden="true" />}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              className="block w-full text-left"
              onClick={() => void handleOpen(notification)}
            >
              <Card className={cn("transition-colors hover:bg-secondary/40", !notification.read && "border-primary/30 bg-primary/5")}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-foreground">{notification.title}</h2>
                        {!notification.read ? <Badge variant="secondary">Unread</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{notification.message}</p>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{formatDate(notification.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
