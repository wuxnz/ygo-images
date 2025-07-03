import { postRouter } from "@/server/api/routers/post";
import { tournamentRouter } from "@/server/api/routers/tournament";
import { matchRouter } from "@/server/api/routers/match";
import { eventLogRouter } from "@/server/api/routers/eventLog";
<<<<<<< HEAD
=======
import { deckRouter } from "@/server/api/routers/deck";
>>>>>>> 9d87b86 (Ignoring images folder)
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
<<<<<<< HEAD
=======
  deck: deckRouter,
>>>>>>> 9d87b86 (Ignoring images folder)
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
