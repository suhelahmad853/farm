import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.SUPERADMIN_NAME || "Super Admin";
  const mobile = process.env.SUPERADMIN_MOBILE;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!mobile || !/^\d{10}$/.test(mobile)) {
    throw new Error("Set SUPERADMIN_MOBILE (10 digits) in .env");
  }
  if (!password || password.length < 6) {
    throw new Error("Set SUPERADMIN_PASSWORD (min 6 characters) in .env");
  }

  const existing = await prisma.superAdmin.findUnique({ where: { mobile } });
  if (existing) {
    console.log(`Super admin ${mobile} already exists. Nothing to do.`);
    return;
  }

  await prisma.superAdmin.create({
    data: { name, mobile, passwordHash: await bcrypt.hash(password, 10) },
  });
  console.log(`Super admin created: ${mobile}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
