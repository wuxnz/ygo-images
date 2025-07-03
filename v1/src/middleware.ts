import type { NextRequest } from "next/server";
import { eventLoggerMiddleware } from "./server/middleware/eventLogger";

export function middleware(req: NextRequest) {
  return eventLoggerMiddleware(req);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
