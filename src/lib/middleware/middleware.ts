import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { encrypt } from "../crypto";

export async function middleware(request: NextRequest) {
  // Skip auth check for the auth endpoint itself to avoid infinite loops
  if (request.nextUrl.pathname === "/api/auth/me") {
    return NextResponse.next();
  }

  // Get the authorization header from the request
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid authorization header" },
      { status: 401 },
    );
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  // Validate the token by calling the auth endpoint
  try {
    const res = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 },
      );
    }

    // Token is valid, continue with the request
    return NextResponse.next();
  } catch (error) {
    console.error("Error validating token in middleware:", error);
    return NextResponse.json(
      { error: "Internal server error during authentication" },
      { status: 500 },
    );
  }
}

export const config = {
  matcher: "/api/:path*", // Match all API routes
};

export default middleware;
