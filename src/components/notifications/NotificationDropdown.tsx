"use client";

import type { Notification } from "@/types/notifications";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, ExternalLink } from "lucide-react";
import Link from "next/link";
import { NotificationItem } from "./NotificationItem";

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick: (notificationId: string) => void;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onNotificationClick,
  onClose,
}: NotificationDropdownProps) {
  return (
    <div className="bg-background absolute right-0 z-50 mt-2 w-96 rounded-lg border shadow-lg">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-muted-foreground text-sm">
              {unreadCount} unread
            </span>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => {
                  onNotificationClick(notification.id);
                  onClose();
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="p-2">
        <Button variant="ghost" className="w-full justify-between" asChild>
          <Link href="/notifications" onClick={onClose}>
            View all notifications
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
