import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.tournament.updateMany({
    where: {
      createdAt: { equals: null },
    },
    data: { createdAt: new Date() },
  });
  console.log("Updated tournaments with null createdAt");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
