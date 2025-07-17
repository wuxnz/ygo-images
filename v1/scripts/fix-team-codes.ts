import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateTeamCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function fixTeamCodes() {
  try {
    // Find all teams with null codes
    const teamsWithNullCode = await prisma.team.findMany({
      where: {
        code: null,
      },
    });

    console.log(`Found ${teamsWithNullCode.length} teams with null codes`);

    // Update each team with a unique code
    for (const team of teamsWithNullCode) {
      let uniqueCode = generateTeamCode();

      // Ensure the code is unique
      let existingTeam = await prisma.team.findFirst({
        where: { code: uniqueCode },
      });

      while (existingTeam) {
        uniqueCode = generateTeamCode();
        existingTeam = await prisma.team.findFirst({
          where: { code: uniqueCode },
        });
      }

      await prisma.team.update({
        where: { id: team.id },
        data: { code: uniqueCode },
      });

      console.log(`Updated team ${team.id} with code ${uniqueCode}`);
    }

    console.log("All team codes have been updated successfully");
  } catch (error) {
    console.error("Error updating team codes:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTeamCodes();
