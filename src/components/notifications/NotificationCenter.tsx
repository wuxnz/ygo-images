"use client";

import { useState, useEffect } from "react";
import { BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import { NotificationSkeleton } from "./NotificationSkeleton";
import {
  type Notification,
  type NotificationType,
} from "@/types/notifications";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications();

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  }, [isOpen, unreadCount, markAllAsRead]);

  // Normalize notifications to always be an array
  const notificationItems = Array.isArray(notifications)
    ? notifications
    : notifications?.notifications || [];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Notifications</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <>
              <NotificationSkeleton />
              <NotificationSkeleton />
              <NotificationSkeleton />
            </>
          ) : notificationItems.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            notificationItems.map(
              ({ id, message, createdAt, read, type, title, data }) => {
                const notification: Notification = {
                  id,
                  userId: "", // Placeholder value since we don't have user ID in this context
                  type: type as NotificationType,
                  title: title || "",
                  message,
                  read,
                  createdAt,
                  updatedAt: createdAt,
                  data: data ? JSON.parse(data) : undefined,
                };
                return (
                  <NotificationItem
                    key={id}
                    notification={notification}
                    onRead={(id) => markAsRead({ notificationId: id })}
                    onDelete={() => {}}
                  />
                );
              },
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
