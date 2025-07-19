# Notification System Integration Guide

## Quick Start Integration

### 1. Install Dependencies

```bash
npm install socket.io socket.io-client date-fns
# or
pnpm add socket.io socket.io-client date-fns
```

### 2. Database Migration

```bash
npx prisma migrate dev --name add_notifications
```

### 3. Start WebSocket Server

```bash
# In one terminal
npm run dev:ws
# or
node src/server/websocket/index.js
```

### 4. Environment Setup

Add to `.env.local`:

```
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## Integration Steps

### Step 1: Add Notification Bell to Navbar

Update `src/components/layout/Navbar.tsx`:

```typescript
import { NotificationBell } from '@/components/notifications/NotificationBell';

// Add to navbar component
<div className="flex items-center gap-4">
  <NotificationBell />
  {/* existing items */}
</div>
```

### Step 2: Create Notification Templates

Create `src/lib/notifications/templates.ts`:

```typescript
import { NotificationType } from "./types";

export const NotificationTemplates = {
  tournament: {
    created: (tournamentName: string, creatorName: string) => ({
      type: NotificationType.TOURNAMENT_CREATED,
      title: "Tournament Created",
      message: `You created "${tournamentName}"`,
    }),
    joined: (tournamentName: string, userName: string) => ({
      type: NotificationType.TOURNAMENT_JOINED,
      title: "Tournament Joined",
      message: `${userName} joined "${tournamentName}"`,
    }),
    started: (tournamentName: string) => ({
      type: NotificationType.TOURNAMENT_STARTED,
      title: "Tournament Started",
      message: `"${tournamentName}" has started`,
    }),
  },
  team: {
    joined: (teamName: string, userName: string) => ({
      type: NotificationType.TEAM_JOINED,
      title: "Team Update",
      message: `${userName} joined "${teamName}"`,
    }),
    kicked: (teamName: string, userName: string) => ({
      type: NotificationType.TEAM_KICKED,
      title: "Team Update",
      message: `${userName} was removed from "${teamName}"`,
    }),
  },
  deck: {
    created: (deckName: string) => ({
      type: NotificationType.DECK_CREATED,
      title: "Deck Created",
      message: `You created "${deckName}"`,
    }),
    submitted: (deckName: string, tournamentName: string) => ({
      type: NotificationType.DECK_SUBMITTED,
      title: "Deck Submitted",
      message: `"${deckName}" submitted to "${tournamentName}"`,
    }),
  },
};
```

### Step 3: Add Notifications to Tournament Operations

Update `src/server/api/routers/tournament.ts`:

```typescript
import { NotificationService } from "@/lib/notifications/service";
import { NotificationTemplates } from "@/lib/notifications/templates";

// In createTournament mutation
const notificationService = NotificationService.getInstance();
await notificationService.createNotification({
  userId: ctx.session.user.id,
  ...NotificationTemplates.tournament.created(
    input.name,
    ctx.session.user.name,
  ),
  data: { tournamentId: tournament.id },
});

// In joinTournament mutation
await notificationService.createNotification({
  userId: ctx.session.user.id,
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
  data: { tournamentId: tournament.id, userId: ctx.session.user.id },
});
```

### Step 4: Add Notifications to Team Operations

Update team-related mutations:

```typescript
// After team member joins
await notificationService.createBulkNotifications({
  userIds: teamMembers.map((m) => m.userId),
  type: NotificationType.TEAM_JOINED,
  title: "Team Update",
  message: `${user.name} joined the team`,
  data: { teamId: team.id, userId: user.id },
});
```

### Step 5: Add Notifications to Deck Operations

Update deck-related mutations:

```typescript
// After deck creation
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

### Step 6: Create Notification Components

#### NotificationBell Component

Create `src/components/notifications/NotificationBell.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/trpc/react';
import { NotificationDropdown } from './NotificationDropdown';
import { useWebSocket } from '@/hooks/useWebSocket';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useWebSocket();

  const { data: dbUnreadCount } = api.notification.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const totalUnreadCount = unreadCount ?? dbUnreadCount ?? 0;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {totalUnreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
          >
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <NotificationDropdown
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
```

### Step 7: Create WebSocket Hook

Create `src/hooks/useWebSocket.ts`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { NotificationPayload } from "@/lib/notifications/types";
import { useSession } from "next-auth/react";

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const newSocket = io(
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_WS_URL || ""
        : "http://localhost:3001",
    );

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    newSocket.on("notification", () => {
      setUnreadCount((prev) => prev + 1);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [session?.user?.id]);

  return { socket, unreadCount };
}
```

### Step 8: Production Setup

#### WebSocket Server

Create `src/server/websocket/index.ts`:

```typescript
import { Server } from "socket.io";
import { createServer } from "http";
import { NotificationService } from "@/lib/notifications/service";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_APP_URL
        : "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_user", (userId: string) => {
    socket.join(`user:${userId}`);
  });

  socket.on("join_tournament", (tournamentId: string) => {
    socket.join(`tournament:${tournamentId}`);
  });

  socket.on("join_team", (teamId: string) => {
    socket.join(`team:${teamId}`);
  });
});

const port = process.env.WS_PORT || 3001;
httpServer.listen(port, () => {
  console.log(`WebSocket server running on port ${port}`);
});
```

### Step 9: Testing Commands

```bash
# Test WebSocket connection
curl -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3001

# Test notification creation
curl -X POST http://localhost:3000/api/trpc/notification.createTest \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id", "type": "TOURNAMENT_CREATED"}'
```

## Usage Examples

### Creating a Notification

```typescript
import { NotificationService } from "@/lib/notifications/service";
import { NotificationType } from "@/lib/notifications/types";

const notificationService = NotificationService.getInstance();

// Single notification
await notificationService.createNotification({
  userId: "user-id",
  type: NotificationType.TOURNAMENT_CREATED,
  title: "Tournament Created",
  message: "Your tournament has been created successfully",
  data: { tournamentId: "tournament-id" },
});

// Bulk notifications
await notificationService.createBulkNotifications({
  userIds: ["user1", "user2", "user3"],
  type: NotificationType.TOURNAMENT_STARTED,
  title: "Tournament Started",
  message: "The tournament has begun!",
  data: { tournamentId: "tournament-id" },
});
```

### Using Notifications in Components

```typescript
import { api } from "@/trpc/react";

// Get notifications
const { data: notifications } = api.notification.getNotifications.useQuery({
  limit: 20,
  offset: 0,
});

// Get unread count
const { data: unreadCount } = api.notification.getUnreadCount.useQuery();

// Mark as read
const markAsRead = api.notification.markAsRead.useMutation();
await markAsRead.mutateAsync({ notificationId: "notification-id" });
```

## Troubleshooting

### Common Issues

1. **WebSocket not connecting**: Check firewall and port configuration
2. **Notifications not appearing**: Verify user preferences and notification service
3. **Database errors**: Ensure migrations are run and schema is updated
4. **CORS issues**: Check WebSocket server configuration

### Debug Commands

```bash
# Check WebSocket server
lsof -i :3001

# Check database tables
npx prisma db pull
npx prisma studio

# Test notification service
node -e "require('./src/lib/notifications/service').test()"
```
