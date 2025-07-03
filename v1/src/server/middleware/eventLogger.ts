import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "@/env";

export async function eventLoggerMiddleware(req: NextRequest) {
  const response = await NextResponse.next();

  // Skip logging for certain paths
  const path = req.nextUrl.pathname;
  if (
    path.startsWith("/_next") ||
    path.startsWith("/favicon.ico") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/api/event-log") ||
    path.startsWith("/api/trpc") ||
    path === "/api/event-log" // Explicitly exclude the event log API
  ) {
    return response;
  }

  // Also skip logging for the event-log API itself to prevent infinite loops
  if (req.nextUrl.pathname === "/api/event-log") {
    return response;
  }

  try {
    const token = await getToken({
      req,
      secret: env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return response;
    }

    const userId = token?.sub;
    const action = req.method;
    const entity = req.nextUrl.pathname.split("/")[1] ?? "unknown";
    const entityId = req.nextUrl.pathname.split("/")[2] ?? "unknown";

    // Log event via API route
    await fetch(new URL("/api/event-log", req.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        entity,
        entityId,
        userId,
        details: {
          url: req.nextUrl.href,
          method: req.method,
          headers: Object.fromEntries(req.headers.entries()),
        },
      }),
    });
  } catch (error) {
    console.error("Failed to log event:", error);
  }

  return response;
}
