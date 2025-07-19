"use client";

import { useState, useEffect, useRef } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markAsRead } =
    useNotifications(10);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notificationId: string) => {
    markAsRead({ notificationId });
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  const count = typeof unreadCount === "number" ? unreadCount : 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center text-xs"
          >
            {count > 99 ? "99+" : count}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <NotificationDropdown
          notifications={Array.isArray(notifications) ? notifications : []}
          unreadCount={count}
          onNotificationClick={handleNotificationClick}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
