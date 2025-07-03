import { db } from "@/server/db";

const SYSTEM_USER_ID = "clw7q7j0m0000v3g0q1q1q1q1";
const SYSTEM_USER_EMAIL = "system@example.com";

export async function ensureSystemUser() {
  try {
    const systemUser = await db.user.upsert({
      where: { id: SYSTEM_USER_ID },
      create: {
        id: SYSTEM_USER_ID,
        email: SYSTEM_USER_EMAIL,
        name: "System User",
        emailVerified: new Date(),
      },
      update: {},
    });
    return systemUser.id;
  } catch (error) {
    console.error("Failed to ensure system user:", error);
    throw error;
  }
}
