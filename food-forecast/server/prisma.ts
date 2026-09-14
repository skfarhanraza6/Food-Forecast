import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma = globalThis.prismaGlobal ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

let isConnected = false;

export async function checkPrismaConnection(): Promise<boolean> {
  if (isConnected) return true;
  try {
    // Attempt a lightweight query to verify active PostgreSQL connection
    await prisma.$queryRaw`SELECT 1;`;
    isConnected = true;
    console.log('⚡ Prisma connected successfully to PostgreSQL database.');
    return true;
  } catch (err: any) {
    console.warn('⚠️ Prisma PostgreSQL connection notice:', err.message);
    return false;
  }
}
