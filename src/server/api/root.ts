import { postRouter } from "@/server/api/routers/post";
import { tournamentRouter } from "@/server/api/routers/tournament";
import { matchRouter } from "@/server/api/routers/match";
import { eventLogRouter } from "@/server/api/routers/eventLog";
import { deckRouter } from "@/server/api/routers/deck";
import { tournamentResultsRouter } from "@/server/api/routers/tournamentResults";
import { tournamentSwissRouter } from "@/server/api/routers/tournamentSwiss";
import { tournamentRoundRobinRouter } from "@/server/api/routers/tournamentRoundRobin";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  tournament: tournamentRouter,
  match: matchRouter,
  eventLog: eventLogRouter,
  deck: deckRouter,
  tournamentResults: tournamentResultsRouter,
  tournamentSwiss: tournamentSwissRouter,
  tournamentRoundRobin: tournamentRoundRobinRouter,
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
