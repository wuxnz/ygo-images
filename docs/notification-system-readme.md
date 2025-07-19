# Notification System Implementation

## Overview

This document provides a comprehensive guide to the notification system implemented in the Yu-Gi-Oh! Tournament Management application. The system provides real-time notifications for tournament events, user activities, and system updates.

## Architecture

The notification system consists of:

1. **Database Layer**: Prisma schema with Notification and NotificationPreferences models
2. **Service Layer**: NotificationService for business logic
3. **API Layer**: tRPC routers for RESTful endpoints
4. **WebSocket Layer**: Real-time notification delivery
5. **UI Layer**: React components for displaying and managing notifications

## Features

### Core Features

- **Real-time notifications** via WebSocket
- **Notification preferences** management
- **Mark as read/unread** functionality
- **Bulk operations** (mark all as read)
- **Rich notifications** with metadata
- **Type-based filtering**
- **Automatic cleanup** of old notifications

### Notification Types

- Tournament events (created, started, completed, etc.)
- Match assignments and results
- Team activities
- Deck management
- User interactions
- System updates

## Database Schema

### Notification Model

```prisma
model Notification {
  id          String   @id @default(cuid())
  userId      String
  type        NotificationType
  title       String
  message     String
  metadata    Json?
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}
```

### NotificationPreferences Model

```prisma
model NotificationPreferences {
  id                String   @id @default(cuid())
  userId            String   @unique
  emailEnabled      Boolean  @default(true)
  pushEnabled       Boolean  @default(true)
  inAppEnabled      Boolean  @default(true)
  tournamentEnabled Boolean  @default(true)
  matchEnabled      Boolean  @default(true)
  teamEnabled       Boolean  @default(true)
  deckEnabled       Boolean  @default(true)
  systemEnabled     Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### tRPC Routers

- `notification.getNotifications` - Get user's notifications
- `notification.getUnreadCount` - Get unread count
- `notification.markAsRead` - Mark notification as read
- `notification.markAllAsRead` - Mark all as read
- `notification.create` - Create notification (admin)
- `notification.getPreferences` - Get user preferences
- `notification.updatePreferences` - Update preferences

## WebSocket Implementation

### Server

- Port: 3001 (development)
- Authentication: User ID required
- Message format: JSON with type and data fields

### Client

- Auto-reconnection with exponential backoff
- Real-time updates via React Query invalidation
- Connection status indicator

## Usage Examples

### Basic Usage

```typescript
// Get notifications
const { notifications, unreadCount, isLoading } = useNotifications();

// Mark as read
const { markAsRead } = useNotifications();
markAsRead(notificationId);

// Get preferences
const { preferences } = useNotificationPreferences();

// Update preferences
const { updatePreferences } = useNotificationPreferences();
updatePreferences({ tournamentEnabled: false });
```

### Creating Notifications

```typescript
// From server-side
await notificationService.createNotification({
  userId: "user123",
  type: "TOURNAMENT_STARTED",
  title: "Tournament Started",
  message: "Your tournament has started!",
  metadata: { tournamentId: "tournament123" },
});
```

## Components

### NotificationBell

Displays notification count and opens dropdown on click.

### NotificationDropdown

Shows list of notifications with mark as read functionality.

### NotificationPreferences

UI for managing notification preferences.

## Testing

### Test Page

Visit `/test/notifications` to test the complete system:

- Create test notifications
- Verify real-time updates
- Test preferences management
- Check WebSocket connectivity

### Manual Testing Steps

1. Start the WebSocket server: `npm run dev:websocket`
2. Navigate to `/test/notifications`
3. Create test notifications
4. Verify real-time updates appear
5. Test mark as read functionality
6. Update preferences and verify changes

## Configuration

### Environment Variables

```bash
# WebSocket
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001

# Database
DATABASE_URL="postgresql://..."
```

### WebSocket Server

```bash
# Development
npm run dev:websocket

# Production
npm run start:websocket
```

## Integration Guide

### Adding New Notification Types

1. Add type to `NotificationType` enum in schema
2. Update `notificationService.createNotification` calls
3. Add UI handling for new type in components
4. Update preferences if needed

### Custom Notification Channels

1. Extend `NotificationPreferences` model
2. Add new preference fields
3. Update service layer
4. Add UI controls

## Performance Considerations

- **Pagination**: Notifications are paginated (default 20 per page)
- **Indexing**: Optimized database indexes for common queries
- **Cleanup**: Automatic cleanup of notifications older than 90 days
- **Caching**: React Query caching with WebSocket invalidation

## Security

- **Authentication**: All endpoints require authenticated user
- **Authorization**: Users can only access their own notifications
- **Input validation**: All inputs validated via tRPC
- **Rate limiting**: Implemented via tRPC middleware

## Troubleshooting

### Common Issues

1. **WebSocket not connecting**
   - Check if server is running on port 3001
   - Verify user authentication
   - Check browser console for errors

2. **Notifications not appearing**
   - Verify database connection
   - Check notification preferences
   - Ensure user ID is correct

3. **Real-time updates not working**
   - Check WebSocket connection status
   - Verify React Query invalidation
   - Check browser network tab

### Debug Commands

```bash
# Check WebSocket server
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3001

# Check database
npx prisma studio
```

## Future Enhancements

- Email notifications
- Push notifications
- Notification templates
- Batch operations
- Advanced filtering
- Notification analytics
- Mobile app integration
