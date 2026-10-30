import { PrismaClient } from '../databases/generated/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { URL } from 'url';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

const dbUrl = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname === 'localhost' ? '127.0.0.1' : dbUrl.hostname,
  port: dbUrl.port ? parseInt(dbUrl.port) : 3306,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace(/^\//, ''),
  connectionLimit: 10
});

const prisma = new PrismaClient({ adapter }).$extends({
  query: {
    $allOperations: async ({ args, query }) => {
      const result = await query(args);

      return JSON.parse(
        JSON.stringify(result, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      );
    },
  },
});

export default prisma;
