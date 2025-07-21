import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/crypto";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    // Decrypt the token using ENC_SECRET
    const decrypted = decrypt(token);

    // Verify the decrypted token matches the expected ENC_SECRET
    if (decrypted !== process.env.ENC_SECRET) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Token is valid - return success
    return NextResponse.json(
      { authenticated: true, message: "Token is valid" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error validating token:", error);
    return NextResponse.json(
      { error: "Token validation failed" },
      { status: 401 },
    );
  }
}
