import { db } from "@/server/db";
import { WebSocketService } from "./websocketService";

interface CreateNotificationOptions {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  email?: boolean;
  push?: boolean;
  inApp?: boolean;
}

export class NotificationService {
  private websocketService: WebSocketService;

  constructor(websocketService: WebSocketService) {
    this.websocketService = websocketService;
  }

  async createNotification(options: CreateNotificationOptions) {
    const { userId, type, title, message, data, email, push, inApp } = options;

    // Check user preferences
    const preferences = await db.notificationPreference.findUnique({
      where: { userId },
    });

    const shouldSendEmail = email ?? preferences?.email ?? true;
    const shouldSendPush = push ?? preferences?.push ?? true;
    const shouldSendInApp = inApp ?? preferences?.inApp ?? true;

    // Check if notification type is enabled
    if (preferences?.enabledTypes) {
      try {
        const enabledTypes = JSON.parse(preferences.enabledTypes) as string[];
        if (!enabledTypes.includes(type)) {
          return null;
        }
      } catch (error) {
        console.error("Error parsing enabledTypes:", error);
      }
    }

    // Create notification record
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        read: false,
      },
    });

    // Send real-time notification
    if (shouldSendInApp) {
      this.websocketService.sendToUser(userId, {
        type: "notification",
        notification: {
          id: notification.id,
          type,
          title,
          message,
          data,
          createdAt: notification.createdAt,
        },
      });
    }

    // TODO: Implement email and push notifications
    if (shouldSendEmail) {
      // Queue email notification
      console.log(`Email notification queued for user ${userId}: ${title}`);
    }

    if (shouldSendPush) {
      // Queue push notification
      console.log(`Push notification queued for user ${userId}: ${title}`);
    }

    return notification;
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }

  async getUnreadCount(userId: string) {
    return db.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async getNotifications(userId: string, limit = 20, cursor?: string) {
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    let nextCursor: string | undefined = undefined;
    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      nextCursor = nextItem!.id;
    }

    return {
      notifications: notifications.map((n: any) => ({
        ...n,
        data: n.data ? JSON.parse(n.data as string) : null,
      })),
      nextCursor,
    };
  }

  async cleanupOldNotifications(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return db.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        read: true,
      },
    });
  }

  async deduplicateNotifications(userId: string, type: string, key: string) {
    // Remove duplicate notifications based on type and key
    const notifications = await db.notification.findMany({
      where: {
        userId,
        type,
        data: {
          contains: key,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (notifications.length > 1) {
      const idsToDelete = notifications.slice(1).map((n: any) => n.id);
      await db.notification.deleteMany({
        where: {
          id: { in: idsToDelete },
        },
      });
    }
  }
}

export const notificationService = new NotificationService(
  new WebSocketService(),
);
