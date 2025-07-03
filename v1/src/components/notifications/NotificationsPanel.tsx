"use client";

import { type Notification } from "@/lib/notifications/NotificationContext";
import { format } from "date-fns";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationsPanel({
  notifications,
  onMarkAsRead,
}: {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}) {
  return (
    <div className="max-h-[400px] overflow-y-auto">
      <div className="border-b p-4">
        <h3 className="font-bold">Notifications</h3>
      </div>

      {notifications.length === 0 ? (
        <div className="text-muted-foreground p-4 text-center">
          No notifications
        </div>
      ) : (
        <div className="divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 ${notification.read ? "bg-muted/50" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{notification.message}</div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {format(
                      new Date(notification.timestamp),
                      "MMM d, yyyy h:mm a",
                    )}
                  </div>
                </div>

                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <Check className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
