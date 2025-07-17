import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const tournamentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        size: z.number(),
        teamSize: z.number().min(1).max(5).default(1),
        bracketType: z.string(),
        rules: z.string(),
        prize: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User ID is missing in session",
        });
      }

      // Ensure system user exists in database
      const { ensureSystemUser } = await import("../../ensureSystemUser");
      await ensureSystemUser();

      const tournament = await ctx.db.tournament.create({
        data: {
          ...input,
          organizerId: ctx.session.user.id,
        },
      });
      return tournament;
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.tournament.findMany({
      include: {
        participants: true,
        organizer: true,
      },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.id },
        include: {
          participants: {
            include: {
              user: true,
              deck: true,
            },
          },
          organizer: true,
          teams: {
            include: {
              team: {
                include: {
                  members: {
                    include: {
                      user: true,
                    },
                  },
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
        name: z.string().optional(),
        size: z.number().optional(),
        bracketType: z.string().optional(),
        rules: z.string().optional(),
        prize: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
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
      if (tournament.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the organizer can update this tournament",
        });
      }
      return await ctx.db.tournament.update({
        where: { id: input.id },
        data: input,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Delete all TournamentParticipant records for this tournament
      await ctx.db.tournamentParticipant.deleteMany({
        where: { tournamentId: input.id },
      });
    }),
  setDeck: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        deckId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const participant = await ctx.db.tournamentParticipant.findFirst({
        where: {
          tournamentId: input.tournamentId,
          userId: ctx.session.user.id,
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only participants can select decks",
        });
      }

      return ctx.db.tournamentParticipant.update({
        where: { id: participant.id },
        data: { deckId: input.deckId },
      });
    }),
  getParticipantDecks: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          participants: {
            include: {
              user: true,
              deck: true,
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

      if (tournament.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only organizers can view participant decks",
        });
      }

      return tournament.participants
        .filter((p) => p.deckId)
        .map((p) => ({
          userId: p.userId,
          userName: p.user.name,
          deckId: p.deckId,
          deckName: p.deck?.name,
        }));
    }),

  join: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.tournamentParticipant.create({
        data: {
          tournament: { connect: { id: input.tournamentId } },
          user: { connect: { id: ctx.session.user.id } },
        },
      });
    }),

  leave: protectedProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.tournament.update({
        where: { id: input.tournamentId },
        data: {
          participants: {
            disconnect: { id: ctx.session.user.id },
          },
        },
      });
    }),

  start: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Only the organizer/creator can start the tournament
      const tournament = (await ctx.db.tournament.findUnique({
        where: { id: input.id },
        include: {
          participants: {
            include: { user: true },
          },
        },
      })) as Prisma.TournamentGetPayload<{
        include: { participants: { include: { user: true } } };
      }>;
      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }
      if (tournament.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the organizer can start this tournament",
        });
      }
      if (tournament.started) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament already started",
        });
      }

      // Randomize participants
      const shuffledParticipants = [...tournament.participants].sort(
        () => Math.random() - 0.5,
      );
      // Use bracketGenerator to generate matches
      const { generateBracket } = await import("@/lib/bracketGenerator");
      const matches = generateBracket(
        {
          ...tournament,
          participants: tournament.participants.map((p) => p.user),
        },
        tournament.bracketType,
      );
      console.log("Bracket matches to create:", matches);

      // Create matches in DB
      for (const match of matches) {
        const created = await ctx.db.match.create({
          data: match,
        });
        console.log("Created match:", created);
      }

      // Set tournament as started
      await ctx.db.tournament.update({
        where: { id: input.id },
        data: { started: true },
      });

      return { success: true };
    }),

  complete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Only the organizer/creator can complete the tournament
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.id },
        include: {
          participants: {
            include: {
              user: true,
              deck: true,
            },
          },
          matches: true,
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (tournament.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the organizer can complete this tournament",
        });
      }

      if (!tournament.started) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament has not started",
        });
      }

      if (tournament.completed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tournament already completed",
        });
      }

      // Check if all matches are completed
      const allMatchesCompleted = tournament.matches.every(
        (match) => match.winnerId !== null || match.winnerTeamId !== null,
      );

      if (!allMatchesCompleted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "All matches must be completed before finishing the tournament",
        });
      }

      // Find the winner (the player who won the final match)
      // The final match is in the last round
      const maxRound = Math.max(...tournament.matches.map((m) => m.round));
      const finalMatch = tournament.matches.find(
        (match) => match.round === maxRound,
      );

      if (!finalMatch || !finalMatch.winnerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Final match winner not determined",
        });
      }

      const winner = tournament.participants.find(
        (p) => p.userId === finalMatch.winnerId,
      );

      if (!winner) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Winner not found in participants",
        });
      }

      // Calculate top 8 placements
      const top8Placements = calculateTop8Placements(tournament);

      // Create tournament result record
      await ctx.db.tournamentResult.create({
        data: {
          tournamentId: input.id,
          winnerId: winner.userId,
        },
      });

      // Mark tournament as completed
      const completedTournament = await ctx.db.tournament.update({
        where: { id: input.id },
        data: {
          completed: true,
          winnerId: winner.userId,
        },
      });

      return { success: true, winnerId: winner.userId };
    }),

  kickParticipant: protectedProcedure
    .input(z.object({ tournamentId: z.string(), userId: z.string() }))
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

      if (tournament.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the organizer can kick participants",
        });
      }

      if (tournament.started) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot kick participants after tournament has started",
        });
      }

      // Remove participant
      await ctx.db.tournamentParticipant.deleteMany({
        where: {
          tournamentId: input.tournamentId,
          userId: input.userId,
        },
      });

      return { success: true };
    }),

  banParticipant: protectedProcedure
    .input(z.object({ tournamentId: z.string(), userId: z.string() }))
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

      if (tournament.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the organizer can ban participants",
        });
      }

      if (tournament.started) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot ban participants after tournament has started",
        });
      }

      // Remove participant (ban is just removal - they can't rejoin)
      await ctx.db.tournamentParticipant.deleteMany({
        where: {
          tournamentId: input.tournamentId,
          userId: input.userId,
        },
      });

      return { success: true };
    }),

  // Team management endpoints
  createTeam: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        tournamentId: z.string(),
        deckId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
        include: {
          teams: true,
        },
      });

      if (!tournament) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tournament not found",
        });
      }

      if (tournament.started) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot create teams after tournament has started",
        });
      }

      // Check if user is already in a team for this tournament
      const existingTeamMember = await ctx.db.teamMember.findFirst({
        where: {
          userId: ctx.session.user.id,
          team: {
            tournaments: {
              some: {
                tournamentId: input.tournamentId,
              },
            },
          },
        },
      });

      if (existingTeamMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already in a team for this tournament",
        });
      }

      // Check if team name already exists in this tournament
      const existingTeamName = await ctx.db.team.findFirst({
        where: {
          name: input.name,
          tournaments: {
            some: {
              tournamentId: input.tournamentId,
            },
          },
        },
      });

      if (existingTeamName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A team with this name already exists in this tournament",
        });
      }

      // Validate deck if provided
      if (input.deckId) {
        const deck = await ctx.db.deck.findFirst({
          where: {
            id: input.deckId,
            userId: ctx.session.user.id,
          },
        });

        if (!deck) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Deck not found or does not belong to you",
          });
        }
      }

      // Generate unique team code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create team
      const team = await ctx.db.team.create({
        data: {
          name: input.name,
          code: code,
          createdById: ctx.session.user.id,
          teamSize: tournament.teamSize,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "leader",
            },
          },
        },
      });

      // Add team to tournament
      const tournamentTeam = await ctx.db.tournamentTeam.create({
        data: {
          tournamentId: input.tournamentId,
          teamId: team.id,
          deckIds: input.deckId ? [input.deckId] : [],
        },
      });

      return {
        teamId: team.id,
        code,
      };
    }),

  joinTeam: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        tournamentId: z.string(),
        deckId: z.string().optional(),
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

      if (tournament.started) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot join teams after tournament has started",
        });
      }

      // Check if user is already in a team for this tournament
      const existingTeamMember = await ctx.db.teamMember.findFirst({
        where: {
          userId: ctx.session.user.id,
          team: {
            tournaments: {
              some: {
                tournamentId: input.tournamentId,
              },
            },
          },
        },
      });

      if (existingTeamMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You are already in a team for this tournament",
        });
      }

      // Validate deck if provided
      if (input.deckId) {
        const deck = await ctx.db.deck.findFirst({
          where: {
            id: input.deckId,
            userId: ctx.session.user.id,
          },
        });

        if (!deck) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Deck not found or does not belong to you",
          });
        }
      }

      // Find team by code
      const team = await ctx.db.team.findFirst({
        where: {
          code: input.code.toUpperCase(),
        },
        include: {
          members: true,
          tournaments: {
            where: {
              tournamentId: input.tournamentId,
            },
          },
        },
      });

      if (!team || team.tournaments.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found or not registered for this tournament",
        });
      }

      if (team.members.length >= tournament.teamSize) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Team is full",
        });
      }

      // Add user to team
      await ctx.db.teamMember.create({
        data: {
          userId: ctx.session.user.id,
          teamId: team.id,
          role: "member",
        },
      });

      // Update team deck IDs if deck provided
      if (input.deckId) {
        const tournamentTeam = await ctx.db.tournamentTeam.findFirst({
          where: {
            tournamentId: input.tournamentId,
            teamId: team.id,
          },
        });

        if (tournamentTeam) {
          const currentDeckIds = tournamentTeam.deckIds || [];
          const teamMembers = await ctx.db.teamMember.findMany({
            where: { teamId: team.id },
            orderBy: { id: "asc" },
          });

          const memberIndex = teamMembers.findIndex(
            (m) => m.userId === ctx.session.user.id,
          );

          if (memberIndex !== -1) {
            const newDeckIds = [...currentDeckIds];
            newDeckIds[memberIndex] = input.deckId;

            await ctx.db.tournamentTeam.update({
              where: { id: tournamentTeam.id },
              data: { deckIds: newDeckIds },
            });
          }
        }
      }

      return { success: true };
    }),

  kickTeamMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is team leader
      const teamMember = await ctx.db.teamMember.findFirst({
        where: {
          teamId: input.teamId,
          userId: ctx.session.user.id,
          role: "leader",
        },
      });

      if (!teamMember) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only team leaders can kick members",
        });
      }

      // Cannot kick yourself
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot kick yourself from the team",
        });
      }

      // Remove member from team
      await ctx.db.teamMember.deleteMany({
        where: {
          teamId: input.teamId,
          userId: input.userId,
        },
      });

      return { success: true };
    }),

  banTeamMember: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is team leader
      const teamMember = await ctx.db.teamMember.findFirst({
        where: {
          teamId: input.teamId,
          userId: ctx.session.user.id,
          role: "leader",
        },
      });

      if (!teamMember) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only team leaders can ban members",
        });
      }

      // Cannot ban yourself
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot ban yourself from the team",
        });
      }

      // Remove member from team (ban is just removal - they can't rejoin)
      await ctx.db.teamMember.deleteMany({
        where: {
          teamId: input.teamId,
          userId: input.userId,
        },
      });

      return { success: true };
    }),

  setTeamDeck: protectedProcedure
    .input(
      z.object({
        tournamentId: z.string(),
        teamId: z.string(),
        deckId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is a member of the team
      const teamMember = await ctx.db.teamMember.findFirst({
        where: {
          teamId: input.teamId,
          userId: ctx.session.user.id,
        },
      });

      if (!teamMember) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only team members can select decks",
        });
      }

      // Check if team is registered for the tournament
      const tournamentTeam = await ctx.db.tournamentTeam.findFirst({
        where: {
          tournamentId: input.tournamentId,
          teamId: input.teamId,
        },
      });

      if (!tournamentTeam) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found in this tournament",
        });
      }

      // Check if tournament has started
      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
      });

      if (tournament?.started) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change decks after tournament has started",
        });
      }

      // Check if deck belongs to the user
      const deck = await ctx.db.deck.findFirst({
        where: {
          id: input.deckId,
          userId: ctx.session.user.id,
        },
      });

      if (!deck) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Deck not found or does not belong to you",
        });
      }

      // Get current deck IDs for the team
      const currentDeckIds = tournamentTeam.deckIds || [];

      // Find the index of this user's deck (if any)
      const teamMembers = await ctx.db.teamMember.findMany({
        where: { teamId: input.teamId },
        orderBy: { id: "asc" },
      });

      const memberIndex = teamMembers.findIndex(
        (m) => m.userId === ctx.session.user.id,
      );

      if (memberIndex === -1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User not found in team",
        });
      }

      // Update the deck ID at the correct position
      const newDeckIds = [...currentDeckIds];
      newDeckIds[memberIndex] = input.deckId;

      return await ctx.db.tournamentTeam.update({
        where: { id: tournamentTeam.id },
        data: { deckIds: newDeckIds },
      });
    }),

  getTeamDecks: protectedProcedure
    .input(z.object({ tournamentId: z.string(), teamId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Check if user is a member of the team or organizer
      const teamMember = await ctx.db.teamMember.findFirst({
        where: {
          teamId: input.teamId,
          userId: ctx.session.user.id,
        },
      });

      const tournament = await ctx.db.tournament.findUnique({
        where: { id: input.tournamentId },
      });

      if (!teamMember && tournament?.organizerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only team members or organizers can view team decks",
        });
      }

      const tournamentTeam = await ctx.db.tournamentTeam.findFirst({
        where: {
          tournamentId: input.tournamentId,
          teamId: input.teamId,
        },
        include: {
          team: {
            include: {
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!tournamentTeam) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found in this tournament",
        });
      }

      // Get deck details for each team member
      const deckIds = tournamentTeam.deckIds || [];
      const decks = await ctx.db.deck.findMany({
        where: {
          id: { in: deckIds.filter(Boolean) },
        },
      });

      return tournamentTeam.team.members.map((member, index) => ({
        userId: member.userId,
        userName: member.user.name,
        deckId: deckIds[index] || null,
        deckName: decks.find((d) => d.id === deckIds[index])?.name || null,
      }));
    }),

  leaveTeam: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        tournamentId: z.string(),
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

      if (tournament.started) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot leave team after tournament has started",
        });
      }

      // Check if user is a member of the team
      const teamMember = await ctx.db.teamMember.findFirst({
        where: {
          teamId: input.teamId,
          userId: ctx.session.user.id,
        },
      });

      if (!teamMember) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not a member of this team",
        });
      }

      // Check if user is the last member (team leader)
      const teamMembers = await ctx.db.teamMember.findMany({
        where: { teamId: input.teamId },
      });

      if (teamMembers.length === 1) {
        // Last member - delete the team entirely
        await ctx.db.tournamentTeam.deleteMany({
          where: {
            teamId: input.teamId,
            tournamentId: input.tournamentId,
          },
        });

        await ctx.db.teamMember.deleteMany({
          where: { teamId: input.teamId },
        });

        await ctx.db.team.delete({
          where: { id: input.teamId },
        });
      } else {
        // Remove member from team
        await ctx.db.teamMember.deleteMany({
          where: {
            teamId: input.teamId,
            userId: ctx.session.user.id,
          },
        });
      }

      return { success: true };
    }),

  deleteTeam: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        tournamentId: z.string(),
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

      if (tournament.started) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete team after tournament has started",
        });
      }

      // Check if user is team leader
      const teamMember = await ctx.db.teamMember.findFirst({
        where: {
          teamId: input.teamId,
          userId: ctx.session.user.id,
          role: "leader",
        },
      });

      if (!teamMember) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only team leaders can delete teams",
        });
      }

      // Remove team from tournament
      await ctx.db.tournamentTeam.deleteMany({
        where: {
          teamId: input.teamId,
          tournamentId: input.tournamentId,
        },
      });

      // Delete all team members
      await ctx.db.teamMember.deleteMany({
        where: { teamId: input.teamId },
      });

      // Delete the team
      await ctx.db.team.delete({
        where: { id: input.teamId },
      });

      return { success: true };
    }),

  getTeamByCode: publicProcedure
    .input(z.object({ code: z.string(), tournamentId: z.string() }))
    .query(async ({ input, ctx }) => {
      const team = await ctx.db.team.findFirst({
        where: {
          code: input.code.toUpperCase(),
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
          tournaments: {
            where: {
              tournamentId: input.tournamentId,
            },
          },
        },
      });

      if (!team || team.tournaments.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found or not registered for this tournament",
        });
      }

      return {
        id: team.id,
        name: team.name,
        code: team.code,
        teamSize: team.teamSize,
        memberCount: team.members.length,
        members: team.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          role: m.role,
        })),
      };
    }),
});

// Helper function to calculate top 8 placements
function calculateTop8Placements(tournament: any) {
  const matches = tournament.matches || [];
  const participants = tournament.participants || [];

  if (matches.length === 0) {
    return [];
  }

  // Build placement array
  const placementMap = new Map<number, { userId: string; deckId?: string }>();

  // 1st place: winner of final match
  const maxRound = Math.max(...matches.map((m: any) => m.round), 0);
  if (maxRound === 0) return [];

  const finalMatch = matches.find(
    (m: any) =>
      m.round === maxRound && (m.winnerId !== null || m.winnerTeamId !== null),
  );

  if (!finalMatch) {
    return [];
  }

  let winnerId: string | null = null;
  if (tournament.teamSize > 1) {
    winnerId = finalMatch.winnerTeamId;
  } else {
    winnerId = finalMatch.winnerId;
  }

  if (winnerId) {
    if (tournament.teamSize > 1) {
      // For team tournaments, use team ID
      placementMap.set(1, {
        userId: winnerId,
      });
    } else {
      // For individual tournaments
      const winnerParticipant = participants.find(
        (p: any) => p.userId === winnerId,
      );
      placementMap.set(1, {
        userId: winnerId,
        deckId: winnerParticipant?.deckId,
      });
    }
  }

  // 2nd place: loser of final match
  if (finalMatch.winnerId || finalMatch.winnerTeamId) {
    let secondPlaceId: string | null = null;
    const winnerField =
      tournament.teamSize > 1 ? finalMatch.winnerTeamId : finalMatch.winnerId;
    const player1Field =
      tournament.teamSize > 1 ? finalMatch.team1Id : finalMatch.player1Id;
    const player2Field =
      tournament.teamSize > 1 ? finalMatch.team2Id : finalMatch.player2Id;

    if (winnerField && player1Field && player2Field) {
      secondPlaceId =
        winnerField === player1Field ? player2Field : player1Field;
    }

    if (secondPlaceId) {
      if (tournament.teamSize > 1) {
        placementMap.set(2, {
          userId: secondPlaceId,
        });
      } else {
        const secondParticipant = participants.find(
          (p: any) => p.userId === secondPlaceId,
        );
        if (secondParticipant) {
          placementMap.set(2, {
            userId: secondPlaceId,
            deckId: secondParticipant.deckId,
          });
        }
      }
    }
  }

  // Semi-finalists (3rd-4th)
  const semiFinalMatches = matches.filter((m: any) => m.round === maxRound - 1);
  const semiFinalists: string[] = [];

  semiFinalMatches.forEach((match: any) => {
    const winnerField =
      tournament.teamSize > 1 ? match.winnerTeamId : match.winnerId;
    const player1Field =
      tournament.teamSize > 1 ? match.team1Id : match.player1Id;
    const player2Field =
      tournament.teamSize > 1 ? match.team2Id : match.player2Id;

    if (winnerField && player1Field && player2Field) {
      const loserId =
        winnerField === player1Field ? player2Field : player1Field;
      if (loserId) semiFinalists.push(loserId);
    }
  });

  semiFinalists.forEach((userId, index) => {
    if (tournament.teamSize > 1) {
      placementMap.set(index + 3, { userId });
    } else {
      const participant = participants.find((p: any) => p.userId === userId);
      if (participant) {
        placementMap.set(index + 3, { userId, deckId: participant.deckId });
      }
    }
  });

  // Quarter-finalists (5th-8th) for 16+ player tournaments
  if (tournament.size >= 16) {
    const quarterFinalMatches = matches.filter(
      (m: any) => m.round === maxRound - 2,
    );
    const quarterFinalists: string[] = [];

    quarterFinalMatches.forEach((match: any) => {
      const winnerField =
        tournament.teamSize > 1 ? match.winnerTeamId : match.winnerId;
      const player1Field =
        tournament.teamSize > 1 ? match.team1Id : match.player1Id;
      const player2Field =
        tournament.teamSize > 1 ? match.team2Id : match.player2Id;

      if (winnerField && player1Field && player2Field) {
        const loserId =
          winnerField === player1Field ? player2Field : player1Field;
        if (loserId) quarterFinalists.push(loserId);
      }
    });

    quarterFinalists.forEach((userId, index) => {
      if (tournament.teamSize > 1) {
        placementMap.set(index + 5, { userId });
      } else {
        const participant = participants.find((p: any) => p.userId === userId);
        if (participant) {
          placementMap.set(index + 5, { userId, deckId: participant.deckId });
        }
      }
    });
  }

  // Convert to array format for database
  const top8Placements = [];
  for (let i = 1; i <= 8; i++) {
    const placement = placementMap.get(i);
    if (placement) {
      top8Placements.push({
        placement: i,
        userId: placement.userId,
        deckId: placement.deckId,
      });
    }
  }

  return top8Placements;
}
