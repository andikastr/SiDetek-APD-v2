import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed default admin user
  const adminUsername = "admin";
  const adminEmail = "admin@sidetek.id";
  const adminName = "Andika Satria Putra";
  const adminPasswordHash = await bcrypt.hash("password123", 10);

  const adminUser = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      email: adminEmail,
      name: adminName,
      passwordHash: adminPasswordHash,
    },
    create: {
      username: adminUsername,
      email: adminEmail,
      name: adminName,
      passwordHash: adminPasswordHash,
    },
  });
  console.log(`✅ User successfully created/updated: ${adminUser.username} (${adminUser.name})`);

  // Seed demo.sidetek user (John Doe)
  const demoUsername = "demo.sidetek";
  const demoEmail = "demo@sidetek.id";
  const demoName = "John Doe";
  const demoPasswordHash = await bcrypt.hash("P@ssw0rd", 10);

  const demoUser = await prisma.user.upsert({
    where: { username: demoUsername },
    update: {
      email: demoEmail,
      name: demoName,
      passwordHash: demoPasswordHash,
    },
    create: {
      username: demoUsername,
      email: demoEmail,
      name: demoName,
      passwordHash: demoPasswordHash,
    },
  });
  console.log(`✅ User successfully created/updated: ${demoUser.username} (${demoUser.name})`);

  // Associate any existing unassigned records to admin
  await prisma.auditLog.updateMany({
    where: { userId: null },
    data: { userId: adminUser.id },
  });

  await prisma.camera.updateMany({
    where: { userId: null },
    data: { userId: adminUser.id },
  });
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
