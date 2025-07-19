import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const teamRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Generate a unique team code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const team = await ctx.db.team.create({
        data: {
          name: input.name,
          description: input.description,
          code,
          ownerId: ctx.session.user.id,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "admin",
            },
          },
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });
      return team;
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.team.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  }),

  getById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.team.findUnique({
        where: { id: input.id },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });
    }),

  addMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is team leader
      const membership = await ctx.db.teamMember.findFirst({
        where: {
          teamId: input.teamId,
          userId: ctx.session.user.id,
          role: "leader",
        },
      });

      if (!membership) {
        throw new Error("Only team leaders can add members");
      }

      // Check if user is already a member
      const existingMember = await ctx.db.teamMember.findFirst({
        where: {
          teamId: input.teamId,
          userId: input.userId,
        },
      });

      if (existingMember) {
        throw new Error("User is already a team member");
      }

      return ctx.db.teamMember.create({
        data: {
          teamId: input.teamId,
          userId: input.userId,
          role: "member",
        },
        include: {
          user: true,
        },
      });
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is team leader or removing themselves
      const membership = await ctx.db.teamMember.findFirst({
        where: {
          teamId: input.teamId,
          userId: ctx.session.user.id,
        },
      });

      if (
        !membership ||
        (membership.role !== "leader" && membership.userId !== input.userId)
      ) {
        throw new Error("Insufficient permissions");
      }

      return ctx.db.teamMember.delete({
        where: {
          teamId_userId: {
            teamId: input.teamId,
            userId: input.userId,
          },
        },
      });
    }),

  getUserTeams: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.team.findMany({
      where: {
        members: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  }),
});
