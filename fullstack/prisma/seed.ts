import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const email = "admin@sidetek.id";
  const name = "Safety Officer";
  const plainPassword = "password123";

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      email,
      name,
      passwordHash,
    },
    create: {
      username,
      email,
      name,
      passwordHash,
    },
  });

  // Associate any existing unassigned records to admin
  await prisma.auditLog.updateMany({
    where: { userId: null },
    data: { userId: user.id },
  });

  await prisma.camera.updateMany({
    where: { userId: null },
    data: { userId: user.id },
  });

  console.log(`✅ Seed user successfully created/updated: ${user.username} (${user.email})`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
