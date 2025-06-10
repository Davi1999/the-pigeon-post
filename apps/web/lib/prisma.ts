import { PrismaClient } from "@prisma/client/edge"

console.log('DB URL:', process.env.DATABASE_URL)
 
export const prisma = new PrismaClient()