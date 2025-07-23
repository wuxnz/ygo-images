import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const tournamentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        format: z.enum([
          "swiss",
          "round_robin",
          "single_elimination",
          "double_elimination",
        ]),
        maxPlayers: z.number().min(2).max(128),
        startDate: z.date(),
        endDate: z.date().optional(),
        prize: z.string().optional(),
        teamSize: z.number().min(1).max(8).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.tournament.create({
        data: {
          name: input.name,
          description: input.description,
          format: input.format,
          maxPlayers: input.maxPlayers,
          startDate: input.startDate,
          endDate: input.endDate,
          prize: input.prize,
          teamSize: input.teamSize,
          creatorId: ctx.session.user.id,
        },
      });
    }),

  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
        status: z.enum(["upcoming", "active", "completed"]).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { limit, cursor, status } = input;

      // MongoDB aggregation pipeline
      const pipeline: any[] = [
        // Match by status if provided
        ...(status ? [{ $match: { status } }] : []),

        // Ensure _id is included and mapped to id
        { $addFields: { id: "$_id" } },

        // Lookup creator details from User collection
        {
          $lookup: {
            from: "User",
            localField: "creatorId",
            foreignField: "id",
            as: "creator",
          },
        },
        { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },

        // Lookup participants
        {
          $lookup: {
            from: "TournamentParticipant",
            localField: "id",
            foreignField: "tournamentId",
            as: "participants",
          },
        },

        // Add participant count
        { $addFields: { participant_count: { $size: "$participants" } } },

        // Sort by creation date
        { $sort: { createdAt: -1 } },

        // Pagination
        { $limit: limit + 1 },
        ...(cursor ? [{ $skip: parseInt(cursor) }] : []),
      ];

      const tournaments = (await ctx.db.tournament.aggregateRaw({
        pipeline: pipeline,
      })) as unknown as any[];

      // Convert raw MongoDB documents to expected format
      const items = tournaments.map((t: any) => {
        // Convert date strings to Date objects with validation
        // Extract date strings directly from the MongoDB document
        const startDate = t.startDate;
        const endDate = t.endDate;
        const createdAt = t.createdAt;
        const updatedAt = t.updatedAt;

        // Validate dates to avoid "Invalid Date" objects
        const isValidDate = (date: any) =>
          date && typeof date === "string" && !isNaN(new Date(date).getTime());

        const validStartDate = isValidDate(startDate)
          ? new Date(startDate)
          : null;
        const validEndDate = isValidDate(endDate) ? new Date(endDate) : null;
        const validCreatedAt = isValidDate(createdAt)
          ? new Date(createdAt)
          : null;
        const validUpdatedAt = isValidDate(updatedAt)
          ? new Date(updatedAt)
          : null;

        return {
          id: t.id,
          name: t.name,
          description: t.description,
          format: t.format,
          maxPlayers: t.maxPlayers,
          status: t.status,
          startDate: startDate,
          endDate: endDate,
          prize: t.prize,
          teamSize: t.teamSize,
          createdAt: createdAt,
          updatedAt: updatedAt,
          creator: t.creator
            ? {
                id: t.creator.id,
                name: t.creator.name,
                email: t.creator.email,
                image: t.creator.image,
              }
            : {
                id: "deleted-user",
                name: "Deleted User",
                email: null,
                image: null,
              },
          participantCount: t.participant_count,
        };
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.id },
        include: {
          creator: true,
          participants: {
            include: {
              user: true,
              deck: true,
            },
          },
          rounds: {
            include: {
              matches: {
                include: {
                  player1: true,
                  player2: true,
                  winner: true,
                },
              },
            },
          },
          results: {
            include: {
              user: true,
            },
            orderBy: { placement: "asc" },
          },
          teams: {
            include: {
              team: {
                include: {
                  members: {
                    include: {
                      user: true,
                    },
                  },
                  owner: true,
                },
              },
            },
          },
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      return tournament;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        maxPlayers: z.number().min(2).max(128).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        prize: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const tournament = await ctx.db.tournament.findUnique({
        where: { id },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (tournament.creatorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the creator can update this tournament",
        });
      }

      if (tournament.status !== "upcoming") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only update upcoming tournaments",
        });
      }

      return ctx.db.tournament.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.id },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (tournament.creatorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the creator can delete this tournament",
        });
      }

      return ctx.db.tournament.delete({
        where: { id: input.id },
      });
    }),

  join: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        deckId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          participants: true,
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (tournament.status !== "upcoming") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only join upcoming tournaments",
        });
      }

      if (tournament.participants.length >= tournament.maxPlayers) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament is full",
        });
      }

      const existingParticipant = tournament.participants.find(
        (p) => p.userId === ctx.session.user.id,
      );

      if (existingParticipant) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already registered for this tournament",
        });
      }

      return ctx.db.tournamentParticipant.create({
        data: {
          tournamentId: input.tournamentId,
          userId: ctx.session.user.id,
          deckId: input.deckId,
        },
      });
    }),

  leave: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const participant = await ctx.db.tournamentParticipant.findUnique({
        where: {
          tournamentId_userId: {
            tournamentId: input.tournamentId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Not registered for this tournament",
        });
      }

      return ctx.db.tournamentParticipant.delete({
        where: {
          tournamentId_userId: {
            tournamentId: input.tournamentId,
            userId: ctx.session.user.id,
          },
        },
      });
    }),

  updateParticipantDeck: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        deckId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const participant = await ctx.db.tournamentParticipant.findUnique({
        where: {
          tournamentId_userId: {
            tournamentId: input.tournamentId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Not registered for this tournament",
        });
      }

      return ctx.db.tournamentParticipant.update({
        where: {
          tournamentId_userId: {
            tournamentId: input.tournamentId,
            userId: ctx.session.user.id,
          },
        },
        data: { deckId: input.deckId },
      });
    }),

  // Team Tournament Endpoints
  createTeam: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        name: z.string().min(1).max(50),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (tournament.status !== "upcoming") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only create teams for upcoming tournaments",
        });
      }

      if (!tournament.teamSize || tournament.teamSize < 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This is not a team tournament",
        });
      }

      // Generate unique team code
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
              role: "leader",
            },
          },
        },
      });

      await ctx.db.tournamentTeam.create({
        data: {
          tournamentId: input.tournamentId,
          teamId: team.id,
        },
      });

      return team;
    }),

  joinTeam: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        teamCode: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          teams: {
            include: {
              team: {
                include: {
                  members: true,
                  bannedUsers: true,
                },
              },
            },
          },
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (tournament.status !== "upcoming") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only join teams for upcoming tournaments",
        });
      }

      const team = await ctx.db.team.findUnique({
        where: { code: input.teamCode.toUpperCase() },
        include: {
          members: true,
          bannedUsers: true,
          tournamentTeams: {
            where: { tournamentId: input.tournamentId },
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      if (team.tournamentTeams.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This team is not part of this tournament",
        });
      }

      const isBanned = team.bannedUsers.some(
        (b) => b.userId === ctx.session.user.id,
      );

      if (isBanned) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have been banned from this team",
        });
      }

      const isMember = team.members.some(
        (m) => m.userId === ctx.session.user.id,
      );

      if (isMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already a member of this team",
        });
      }

      if (team.members.length >= (tournament.teamSize || 4)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Team is full",
        });
      }

      return ctx.db.teamMember.create({
        data: {
          teamId: team.id,
          userId: ctx.session.user.id,
          role: "member",
        },
      });
    }),

  leaveTeam: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        teamId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        include: {
          members: true,
          tournamentTeams: {
            where: { tournamentId: input.tournamentId },
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      if (team.tournamentTeams.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This team is not part of this tournament",
        });
      }

      const member = team.members.find((m) => m.userId === ctx.session.user.id);

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not a member of this team",
        });
      }

      if (member.role === "leader") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Team leader cannot leave the team",
        });
      }

      return ctx.db.teamMember.delete({
        where: {
          teamId_userId: {
            teamId: input.teamId,
            userId: ctx.session.user.id,
          },
        },
      });
    }),

  deleteTeam: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        teamId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        include: {
          members: true,
          tournamentTeams: {
            where: { tournamentId: input.tournamentId },
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      if (team.tournamentTeams.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This team is not part of this tournament",
        });
      }

      const leader = team.members.find(
        (m) => m.userId === ctx.session.user.id && m.role === "leader",
      );

      if (!leader) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only team leader can delete the team",
        });
      }

      return ctx.db.team.delete({
        where: { id: input.teamId },
      });
    }),

  getTeamByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.db.team.findUnique({
        where: { code: input.code.toUpperCase() },
        include: {
          members: {
            include: {
              user: true,
            },
          },
          owner: true,
        },
      });
    }),

  kickTeamMember: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        teamId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        include: {
          members: true,
          tournamentTeams: {
            where: { tournamentId: input.tournamentId },
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      if (team.tournamentTeams.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This team is not part of this tournament",
        });
      }

      const leader = team.members.find(
        (m) => m.userId === ctx.session.user.id && m.role === "leader",
      );

      if (!leader) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only team leader can kick members",
        });
      }

      const member = team.members.find((m) => m.userId === input.userId);

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      if (member.role === "leader") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot kick team leader",
        });
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

  banTeamMember: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        teamId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        include: {
          members: true,
          tournamentTeams: {
            where: { tournamentId: input.tournamentId },
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      if (team.tournamentTeams.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This team is not part of this tournament",
        });
      }

      const leader = team.members.find(
        (m) => m.userId === ctx.session.user.id && m.role === "leader",
      );

      if (!leader) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only team leader can ban members",
        });
      }

      const member = team.members.find((m) => m.userId === input.userId);

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });
      }

      if (member.role === "leader") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot ban team leader",
        });
      }

      // Remove member from team
      await ctx.db.teamMember.delete({
        where: {
          teamId_userId: {
            teamId: input.teamId,
            userId: input.userId,
          },
        },
      });

      // Ban user from team
      return ctx.db.bannedUser.create({
        data: {
          teamId: input.teamId,
          userId: input.userId,
        },
      });
    }),

  updateTeamMemberDeck: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        teamId: z.string(),
        deckId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        include: {
          members: true,
          tournamentTeams: {
            where: { tournamentId: input.tournamentId },
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      if (team.tournamentTeams.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This team is not part of this tournament",
        });
      }

      const member = team.members.find((m) => m.userId === ctx.session.user.id);

      if (!member) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not a member of this team",
        });
      }

      return ctx.db.teamMember.update({
        where: {
          teamId_userId: {
            teamId: input.teamId,
            userId: ctx.session.user.id,
          },
        },
        data: { deckId: input.deckId },
      });
    }),

  getTeamDecks: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        teamId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        include: {
          members: {
            include: {
              user: true,
            },
          },
          tournamentTeams: {
            where: { tournamentId: input.tournamentId },
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });
      }

      if (team.tournamentTeams.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This team is not part of this tournament",
        });
      }

      // Check if user is a member of this team
      const isMember = team.members.some(
        (m) => m.userId === ctx.session.user.id,
      );

      if (!isMember) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not a member of this team",
        });
      }

      const membersWithDecks = await ctx.db.teamMember.findMany({
        where: { teamId: input.teamId },
        include: {
          user: true,
        },
      });

      const membersWithDeckData = await Promise.all(
        membersWithDecks.map(async (member) => {
          const deck = member.deckId
            ? await ctx.db.deck.findUnique({
                where: { id: member.deckId },
              })
            : null;

          return {
            userId: member.userId,
            username: member.user.name,
            deckId: member.deckId,
            deck,
          };
        }),
      );

      return membersWithDeckData;
    }),

  getTournamentTeams: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          teams: {
            include: {
              team: {
                include: {
                  members: {
                    include: {
                      user: true,
                    },
                  },
                  owner: true,
                },
              },
            },
          },
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      return tournament.teams.map((tournamentTeam) => ({
        ...tournamentTeam.team,
        memberCount: tournamentTeam.team.members.length,
      }));
    }),

  startTournament: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.id },
        include: {
          participants: true,
          teams: {
            include: {
              team: {
                include: {
                  members: true,
                },
              },
            },
          },
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (tournament.creatorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the creator can start this tournament",
        });
      }

      if (tournament.status !== "upcoming") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament already started or completed",
        });
      }

      // Check minimum participants
      const hasTeams = tournament.teamSize && tournament.teamSize > 1;
      let participantCount = 0;

      if (hasTeams) {
        participantCount = tournament.teams.length;
      } else {
        participantCount = tournament.participants.length;
      }

      if (participantCount < 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "At least 2 participants required to start tournament",
        });
      }

      // Route to appropriate start method based on format
      if (tournament.format === "swiss") {
        // Swiss tournament implementation needs to be completed
        throw new TRPCError({
          code: "NOT_IMPLEMENTED",
          message: "Swiss tournament format not yet implemented",
        });
        return ctx.db.$transaction(async (tx) => {
          // Update tournament status
          await tx.tournament.update({
            where: { id: input.id },
            data: { status: "active" },
          });

          // Create first round
          const firstRound = await tx.tournamentRound.create({
            data: {
              tournamentId: input.id,
              roundNumber: 1,
            },
          });

          // Create initial matches for round 1 (random pairings)
          const participants = await tx.tournamentParticipant.findMany({
            where: { tournamentId: input.id },
            include: { user: true },
          });

          const shuffled = [...participants].sort(() => Math.random() - 0.5);
          const matches = [];

          for (let i = 0; i < shuffled.length - 1; i += 2) {
            const player1 = shuffled[i];
            const player2 = shuffled[i + 1];

            if (player1 && player2) {
              const match = await tx.tournamentMatch.create({
                data: {
                  roundId: firstRound.id,
                  player1Id: player1.userId,
                  player2Id: player2.userId,
                },
              });
              matches.push(match);
            }
          }

          return { success: true, matches, format: "swiss" };
        });
      } else if (tournament.format === "single_elimination") {
        // Use single elimination bracket generation
        const { generateBracket } = await import("@/lib/bracketGenerator");

        return ctx.db.$transaction(async (tx) => {
          // Update tournament status
          await tx.tournament.update({
            where: { id: input.id },
            data: { status: "active" },
          });

          // Get participants
          let participants = [];
          if (hasTeams) {
            const teamParticipants = await tx.tournamentTeam.findMany({
              where: { tournamentId: input.id },
              include: { team: true },
            });
            participants = teamParticipants.map((tp) => ({
              id: tp.teamId,
              name: tp.team.name,
              code: tp.team.code,
              description: tp.team.description,
              ownerId: tp.team.ownerId,
              // Add required user fields with null values
              email: null,
              emailVerified: null,
              image: null,
              createdAt: tp.team.createdAt,
              updatedAt: tp.team.updatedAt,
            }));
          } else {
            const individualParticipants =
              await tx.tournamentParticipant.findMany({
                where: { tournamentId: input.id },
                include: { user: true },
              });
            participants = individualParticipants.map((p) => p.user);
          }

          // Generate bracket
          const matches = generateBracket(
            { ...tournament, participants },
            tournament.format,
          );

          // Create first round
          const firstRound = await tx.tournamentRound.create({
            data: {
              tournamentId: input.id,
              roundNumber: 1,
            },
          });

          // Create matches
          const createdMatches = [];
          for (const match of matches.filter((m) => m.round === 1)) {
            if (!match.player1Id || !match.player2Id) {
              throw new Error("Invalid match players");
            }
            const createdMatch = await tx.tournamentMatch.create({
              data: {
                roundId: firstRound.id,
                player1Id: match.player1Id,
                player2Id: match.player2Id,
              },
            });
            createdMatches.push(createdMatch);
          }

          return {
            success: true,
            matches: createdMatches,
            format: "single_elimination",
          };
        });
      } else if (tournament.format === "round_robin") {
        // Use round robin generation
        const { generateRoundRobinPairings } = await import(
          "@/lib/roundRobinPairing"
        );

        return ctx.db.$transaction(async (tx) => {
          // Update tournament status
          await tx.tournament.update({
            where: { id: input.id },
            data: { status: "active" },
          });

          // Get participants
          let participants = [];
          if (hasTeams) {
            const teamParticipants = await tx.tournamentTeam.findMany({
              where: { tournamentId: input.id },
              include: { team: true },
            });
            participants = teamParticipants.map((tp) => ({
              ...tp.team,
              id: tp.teamId,
            }));
          } else {
            const individualParticipants =
              await tx.tournamentParticipant.findMany({
                where: { tournamentId: input.id },
                include: { user: true },
              });
            participants = individualParticipants.map((p) => ({
              ...p.user,
              name: p.user.name || `Player ${p.user.id.substring(0, 8)}`,
            }));
          }

          // Generate round robin matches with sanitized names
          const matches = generateRoundRobinPairings(
            participants.map((p) => ({
              ...p,
              name: p.name || `Participant ${p.id.substring(0, 8)}`,
            })),
          );

          // Create rounds and matches
          const rounds: Record<number, any> = {};
          const createdMatches = [];

          for (const match of matches) {
            let round = rounds[match.round];
            if (!round) {
              round = await tx.tournamentRound.create({
                data: {
                  tournamentId: input.id,
                  roundNumber: match.round,
                },
              });
              rounds[match.round] = round;
            }

            const createdMatch = await tx.tournamentMatch.create({
              data: {
                roundId: round.id,
                player1Id: match.player1Id,
                player2Id: match.player2Id,
              },
            });
            createdMatches.push(createdMatch);
          }

          return {
            success: true,
            matches: createdMatches,
            format: "round_robin",
          };
        });
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Unsupported tournament format",
      });
    }),
  getUserParticipations: protectedProcedure
    .output(
      z.array(
        z.object({
          id: z.string(),
          userId: z.string(),
          tournamentId: z.string(),
          deckId: z.string().nullable(),
          tournament: z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            format: z.enum([
              "swiss",
              "round_robin",
              "single_elimination",
              "double_elimination",
            ]),
            maxPlayers: z.number(),
            startDate: z.date(),
            endDate: z.date().nullable(),
            prize: z.string().nullable(),
            teamSize: z.number().nullable(),
            status: z.enum(["upcoming", "active", "completed"]),
            creatorId: z.string(),
            createdAt: z.date(),
            updatedAt: z.date(),
            creator: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string().nullable(),
              image: z.string().nullable(),
            }),
            _count: z.object({
              participants: z.number(),
            }),
          }),
          deck: z
            .object({
              id: z.string(),
              name: z.string(),
              description: z.string().nullable(),
              userId: z.string(),
              createdAt: z.date(),
              updatedAt: z.date(),
            })
            .nullable(),
        }),
      ),
    )
    .query(async ({ ctx }) => {
      const participations = await ctx.db.tournamentParticipant.findMany({
        where: { userId: ctx.session.user.id },
        include: {
          tournament: {
            include: {
              creator: true,
              _count: {
                select: { participants: true },
              },
            },
          },
          deck: true,
        },
        orderBy: { tournament: { startDate: "desc" } },
      });

      // Transform the data to match the expected output schema
      return participations.map((participation) => ({
        id: participation.id,
        userId: participation.userId,
        tournamentId: participation.tournamentId,
        deckId: participation.deckId,
        tournament: {
          id: participation.tournament.id,
          name: participation.tournament.name,
          description: participation.tournament.description,
          format: participation.tournament.format as
            | "swiss"
            | "round_robin"
            | "single_elimination"
            | "double_elimination",
          maxPlayers: participation.tournament.maxPlayers,
          startDate: participation.tournament.startDate,
          endDate: participation.tournament.endDate,
          prize: participation.tournament.prize,
          teamSize: participation.tournament.teamSize,
          status: participation.tournament.status as
            | "upcoming"
            | "active"
            | "completed",
          creatorId: participation.tournament.creatorId,
          createdAt: participation.tournament.createdAt,
          updatedAt: participation.tournament.updatedAt,
          creator: participation.tournament.creator
            ? {
                id: participation.tournament.creator.id,
                name: participation.tournament.creator.name,
                email: participation.tournament.creator.email,
                image: participation.tournament.creator.image,
              }
            : {
                id: "deleted-user",
                name: "Deleted User",
                email: null,
                image: null,
              },
          _count: {
            participants: participation.tournament._count.participants,
          },
        },
        deck: participation.deck
          ? {
              id: participation.deck.id,
              name: participation.deck.name,
              description: participation.deck.description,
              userId: participation.deck.userId,
              createdAt: participation.deck.createdAt,
              updatedAt: participation.deck.updatedAt,
            }
          : null,
      }));
    }),
});
