const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "suporte.splinkagencia@gmail.com".toLowerCase().trim();
  const rawPass = "xvpc7gn8";
  const hash = await bcrypt.hash(rawPass, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hash,
      name: "Splink Agência",
      plan: "LIFETIME",
    },
    create: {
      email,
      name: "Splink Agência",
      passwordHash: hash,
      plan: "LIFETIME",
      brandKit: {
        create: {
          displayName: "Splink Agência",
          handle: "splinkagencia",
        },
      },
    },
    include: { brandKit: true },
  });

  console.log("SUCCESS: Usuário criado/atualizado com sucesso!");
  console.log({
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    brandKit: user.brandKit,
  });
}

main()
  .catch((e) => {
    console.error("ERRO:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
