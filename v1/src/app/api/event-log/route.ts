import { db } from "@/server/db";
import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { env } from "@/env";

export async function POST(req: NextRequest) {
  const data = await req.json();

  try {
    const token = await getToken({
      req,
      secret: env.AUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token?.sub;

    const event = await db.eventLog.create({
      data: data,
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Failed to log event via API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
