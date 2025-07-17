import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const deckRouter = createTRPCRouter({
  // Get all decks for the current user
  getUserDecks: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.deck.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });
  }),

  // Get a specific deck by ID
  getDeck: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const deck = await ctx.db.deck.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!deck) {
        throw new Error("Deck not found");
      }

      return deck;
    }),

  // Delete a deck
  deleteDeck: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const deck = await ctx.db.deck.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!deck) {
        throw new Error("Deck not found");
      }

      // TODO: Also delete the file from S3
      await ctx.db.deck.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),

  // Update deck details (name and description)
  updateDeck: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(50).optional(),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const deck = await ctx.db.deck.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!deck) {
        throw new Error("Deck not found");
      }

      // Check if new name already exists for this user (if name is being updated)
      if (input.name && input.name !== deck.name) {
        const existingDeck = await ctx.db.deck.findFirst({
          where: {
            userId: ctx.session.user.id,
            name: input.name,
            id: { not: input.id },
          },
        });

        if (existingDeck) {
          throw new Error("A deck with this name already exists");
        }
      }

      const updatedDeck = await ctx.db.deck.update({
        where: {
          id: input.id,
        },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
        },
      });

      return updatedDeck;
    }),
});
