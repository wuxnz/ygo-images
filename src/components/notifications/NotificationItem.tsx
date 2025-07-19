"use client";

import { type Notification } from "@/types/notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Bell, Trophy, Users, FileText, User, AlertCircle } from "lucide-react";

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  onRead?: (id: string) => void;
  onDelete?: () => void;
}

const notificationIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  TOURNAMENT_CREATED: Trophy,
  TOURNAMENT_JOINED: Trophy,
  TOURNAMENT_STARTED: Trophy,
  TOURNAMENT_COMPLETED: Trophy,
  TOURNAMENT_CANCELLED: Trophy,
  ROUND_STARTED: Trophy,
  MATCH_ASSIGNED: Trophy,
  MATCH_RESULT_SUBMITTED: Trophy,
  TEAM_CREATED: Users,
  TEAM_JOINED: Users,
  TEAM_MEMBER_ADDED: Users,
  TEAM_MEMBER_REMOVED: Users,
  TEAM_DELETED: Users,
  DECK_CREATED: FileText,
  DECK_UPDATED: FileText,
  DECK_SHARED: FileText,
  DECK_LIKED: FileText,
  USER_FOLLOWED: User,
  USER_MENTIONED: User,
  SYSTEM_MAINTENANCE: AlertCircle,
  SYSTEM_UPDATE: AlertCircle,
};

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const Icon = notificationIcons[notification.type] || Bell;

  return (
    <div
      className={cn(
        "hover:bg-accent/50 cursor-pointer p-4 transition-colors",
        !notification.read && "bg-accent/20",
      )}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
            <Icon className="text-primary h-4 w-4" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm leading-none font-medium">
                {notification.title}
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                {notification.message}
              </p>
            </div>
            {!notification.read && (
              <div className="bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full" />
            )}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
