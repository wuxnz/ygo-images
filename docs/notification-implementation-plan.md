# Notification System Implementation Plan

## Current Status

✅ Database schema updated with notification tables
✅ Notification service layer created
✅ WebSocket server infrastructure
✅ tRPC API endpoints for notifications
⏳ UI components (in progress)
⏳ Integration with existing features

## Remaining Implementation Steps

### 1. Complete UI Components

Create the following React components:

#### NotificationItem.tsx

```typescript
'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { NotificationType } from '@/lib/notifications/types';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    read: boolean;
    createdAt: Date;
  };
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationItem({ notification, onRead, onDelete }: NotificationItemProps) {
  const markAsReadMutation = api.notification.markAsRead.useMutation();
  const deleteMutation = api.notification.deleteNotification.useMutation();

  const handleMarkAsRead = () => {
    if (!notification.read) {
      markAsReadMutation.mutate({ notificationId: notification.id });
      onRead(notification.id);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate({ notificationId: notification.id });
    onDelete(notification.id);
  };

  return (
    <div className={`p-4 border-b hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium">{notification.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-2">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAsRead}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### NotificationSkeleton.tsx

```typescript
export function NotificationSkeleton() {
  return (
    <div className="p-4 border-b animate-pulse">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
}
```

#### useWebSocket.ts Hook

```typescript
"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { NotificationPayload } from "@/lib/notifications/types";
import { useSession } from "next-auth/react";

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const newSocket = io(
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_WS_URL || ""
        : "http://localhost:3001",
      {
        path: "/api/socket.io",
      },
    );

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    newSocket.on("notification", (notification: NotificationPayload) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    newSocket.on("notification_read", ({ notificationId }) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    newSocket.on("all_notifications_read", () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [session?.user?.id]);

  const subscribeToTournament = (tournamentId: string) => {
    socket?.emit("subscribe_tournament", tournamentId);
  };

  const subscribeToTeam = (teamId: string) => {
    socket?.emit("subscribe_team", teamId);
  };

  return {
    socket,
    unreadCount,
    notifications,
    subscribeToTournament,
    subscribeToTeam,
  };
}
```

### 2. Update Layout to Include Notification Bell

Add to `src/components/layout/Navbar.tsx`:

```typescript
import { NotificationBell } from '@/components/notifications/NotificationBell';

// Add NotificationBell component in the navbar
<div className="flex items-center gap-4">
  <NotificationBell />
  {/* Other navbar items */}
</div>
```

### 3. Integrate Notifications into Tournament Operations

#### Tournament Creation

In `src/server/api/routers/tournament.ts`, add notification triggers:

```typescript
// After tournament creation
await notificationService.createNotification({
  userId: ctx.session.user.id,
  ...NotificationTemplates.tournament.created(
    tournament.name,
    ctx.session.user.name,
  ),
  data: { tournamentId: tournament.id },
});

// Notify followers if any
const followers = await ctx.db.follow.findMany({
  where: { followingId: ctx.session.user.id },
});
await notificationService.createBulkNotifications({
  userIds: followers.map((f) => f.followerId),
  type: NotificationType.TOURNAMENT_CREATED,
  title: "New Tournament",
  message: `${ctx.session.user.name} created "${tournament.name}"`,
  data: { tournamentId: tournament.id, creatorId: ctx.session.user.id },
});
```

#### Tournament Join

```typescript
// After user joins tournament
await notificationService.createNotification({
  userId: input.userId,
  ...NotificationTemplates.tournament.joined(
    tournament.name,
    ctx.session.user.name,
  ),
  data: { tournamentId: tournament.id },
});

// Notify tournament creator
await notificationService.createNotification({
  userId: tournament.creatorId,
  ...NotificationTemplates.tournament.joined(
    tournament.name,
    ctx.session.user.name,
  ),
  data: { tournamentId: tournament.id, userId: input.userId },
});
```

### 4. Integrate Notifications into Team Operations

#### Team Join/Leave

```typescript
// After team operations
await notificationService.createBulkNotifications({
  userIds: teamMembers.map((m) => m.userId),
  type: NotificationType.TEAM_JOINED,
  title: "Team Update",
  message: `${user.name} joined the team`,
  data: { teamId: team.id, userId: user.id },
});
```

### 5. Integrate Notifications into Deck Operations

#### Deck Creation/Update

```typescript
// After deck operations
await notificationService.createNotification({
  userId: ctx.session.user.id,
  ...NotificationTemplates.deck.created(deck.name),
  data: { deckId: deck.id },
});

// Notify team members if deck is shared
if (deck.teamId) {
  const teamMembers = await ctx.db.teamMember.findMany({
    where: { teamId: deck.teamId, userId: { not: ctx.session.user.id } },
  });
  await notificationService.createBulkNotifications({
    userIds: teamMembers.map((m) => m.userId),
    type: NotificationType.DECK_CREATED,
    title: "New Deck",
    message: `${ctx.session.user.name} created "${deck.name}"`,
    data: { deckId: deck.id, teamId: deck.teamId },
  });
}
```

### 6. Database Migration Script

Create `prisma/migrations/add_notifications/migration.sql`:

```sql
-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "push" BOOLEAN NOT NULL DEFAULT true,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "types" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificationBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "lastEvent" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationBatch_userId_type_key" UNIQUE ("userId", "type")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_read_idx" ON "Notification"("read");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "NotificationBatch_userId_idx" ON "NotificationBatch"("userId");
```

### 7. Environment Variables

Add to `.env.example`:

```bash
# WebSocket Configuration
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 8. Package Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "socket.io": "^4.7.2",
    "socket.io-client": "^4.7.2",
    "date-fns": "^2.30.0"
  }
}
```

### 9. Testing Checklist

- [ ] Test WebSocket connection
- [ ] Test notification creation
- [ ] Test real-time delivery
- [ ] Test notification preferences
- [ ] Test batch notifications
- [ ] Test mark as read functionality
- [ ] Test cleanup of old notifications
- [ ] Test across different user roles

### 10. Deployment Considerations

- Configure WebSocket server for production
- Set up Redis adapter for WebSocket scaling
- Configure load balancer for WebSocket connections
- Set up notification cleanup cron job
