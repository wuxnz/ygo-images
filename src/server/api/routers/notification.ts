import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { notificationService } from "@/server/services/notificationService";

const NOTIFICATION_TYPES = [
  "TOURNAMENT_CREATED",
  "TOURNAMENT_JOINED",
  "TOURNAMENT_STARTED",
  "TOURNAMENT_COMPLETED",
  "TOURNAMENT_CANCELLED",
  "ROUND_STARTED",
  "MATCH_ASSIGNED",
  "MATCH_RESULT_SUBMITTED",
  "TEAM_CREATED",
  "TEAM_JOINED",
  "TEAM_MEMBER_ADDED",
  "TEAM_MEMBER_REMOVED",
  "TEAM_DELETED",
  "DECK_CREATED",
  "DECK_UPDATED",
  "DECK_SHARED",
  "DECK_LIKED",
  "USER_FOLLOWED",
  "USER_MENTIONED",
  "SYSTEM_MAINTENANCE",
  "SYSTEM_UPDATE",
] as const;

export const notificationRouter = createTRPCRouter({
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const notifications = await ctx.db.notification.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem!.id;
      }

      return {
        notifications,
        nextCursor,
      };
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.notification.count({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
    });
    return count;
  }),

  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { notificationId } = input;

      const notification = await ctx.db.notification.findFirst({
        where: {
          id: notificationId,
          userId: ctx.session.user.id,
        },
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      await ctx.db.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });

      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.notification.updateMany({
      where: {
        userId: ctx.session.user.id,
        read: false,
      },
      data: { read: true },
    });

    return { success: true };
  }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    let preferences = await ctx.db.notificationPreference.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!preferences) {
      // Create default preferences if they don't exist
      preferences = await ctx.db.notificationPreference.create({
        data: {
          userId: ctx.session.user.id,
          email: true,
          push: true,
          inApp: true,
          enabledTypes: JSON.stringify(Array.from(NOTIFICATION_TYPES)),
        },
      });
    }

    return preferences;
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        email: z.boolean().optional(),
        push: z.boolean().optional(),
        inApp: z.boolean().optional(),
        enabledTypes: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { email, push, inApp, enabledTypes } = input;

      const updateData: any = {};
      if (email !== undefined) updateData.email = email;
      if (push !== undefined) updateData.push = push;
      if (inApp !== undefined) updateData.inApp = inApp;
      if (enabledTypes !== undefined)
        updateData.enabledTypes = JSON.stringify(enabledTypes);

      const preferences = await ctx.db.notificationPreference.upsert({
        where: { userId: ctx.session.user.id },
        update: updateData,
        create: {
          userId: ctx.session.user.id,
          email: email ?? true,
          push: push ?? true,
          inApp: inApp ?? true,
          enabledTypes: JSON.stringify(
            enabledTypes ?? Array.from(NOTIFICATION_TYPES),
          ),
        },
      });

      return preferences;
    }),

  // Test endpoint for creating notifications
  createTestNotification: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        title: z.string(),
        message: z.string(),
        userId: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const targetUserId = input.userId || ctx.session.user.id;

      const notification = await notificationService.createNotification({
        userId: targetUserId,
        type: input.type as any,
        title: input.title,
        message: input.message,
        data: input.metadata || {},
      });

      return notification;
    }),
});
