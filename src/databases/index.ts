// // Explicitly import from your custom generated directory folder 
// // to restore full TypeScript autocomplete engine support
// import { PrismaClient } from './migrations/index.js'; 

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined
// }

// export const db = globalForPrisma.prisma ?? new PrismaClient()

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
