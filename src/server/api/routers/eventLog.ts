import { z } from "zod";
import { db } from "@/server/db";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { ensureSystemUser } from "@/server/ensureSystemUser";

export const eventLogRouter = createTRPCRouter({
  logEvent: publicProcedure
    .input(
      z.object({
        action: z.string(),
        entity: z.string(),
        entityId: z.string(),
        userId: z.string().optional(),
        details: z.record(z.unknown()),
      }),
    )
    .mutation(async ({ input }) => {
      const userId = input.userId ?? (await ensureSystemUser());

      return await db.eventLog.create({
        data: {
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          userId,
          details: input.details as any, // Workaround for Prisma Json type
        },
      });
    }),
});
