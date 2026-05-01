const { PrismaClient } = require("./generated/client");

const globalForPrisma = globalThis;

const prisma = globalForPrisma.__agentixPrisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__agentixPrisma = prisma;
}

module.exports = {
  prisma,
};
