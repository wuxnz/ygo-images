import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { tournamentRouter } from "@/server/api/routers/tournament";
import { deckRouter } from "@/server/api/routers/deck";
import { teamRouter } from "@/server/api/routers/team";
import { tournamentSwissRouter } from "@/server/api/routers/tournamentSwiss";
import { tournamentResultsRouter } from "@/server/api/routers/tournamentResults";
import { notificationRouter } from "@/server/api/routers/notification";
import { matchRouter } from "@/server/api/routers/match";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  tournament: tournamentRouter,
  deck: deckRouter,
  team: teamRouter,
  tournamentSwiss: tournamentSwissRouter,
  tournamentResults: tournamentResultsRouter,
  notification: notificationRouter,
  match: matchRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
