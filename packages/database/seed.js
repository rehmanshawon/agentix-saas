const bcrypt = require("bcryptjs");
const { prisma } = require("./index");

async function main() {
  const email = process.env.SEED_EMAIL || "admin@agentix.com";
  const password = process.env.SEED_PASSWORD || "password";
  const workspaceName = process.env.SEED_WORKSPACE_NAME || "Agentix Demo";
  const agentName = process.env.SEED_AGENT_NAME || "SupportBot";

  const passwordHash = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: {
      workspaces: {
        include: {
          workspace: {
            include: {
              agents: true,
            },
          },
        },
      },
    },
  });

  if (existingUser) {
    console.log(`Seed user already exists: ${email}`);
    if (existingUser.workspaces[0]?.workspace) {
      console.log(`Workspace: ${existingUser.workspaces[0].workspace.name}`);
    }
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: "Agentix Admin",
      email,
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: workspaceName,
      subscriptionTier: "STARTER",
      tokenBalance: 500,
    },
  });

  await prisma.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "OWNER",
    },
  });

  const agent = await prisma.agent.create({
    data: {
      workspaceId: workspace.id,
      name: agentName,
      systemPrompt:
        "You are a helpful customer support AI. Be polite, concise, and factual.",
      llmProvider: "openai",
      modelName: "gpt-4o-mini",
      colorHex: "#4F46E5",
    },
  });

  console.log("Seed completed.");
  console.log(`Login email: ${email}`);
  console.log(`Login password: ${password}`);
  console.log(`Workspace ID: ${workspace.id}`);
  console.log(`Agent ID: ${agent.id}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
