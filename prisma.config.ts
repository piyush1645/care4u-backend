import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./src/databases/models",
  migrations: {
    path: "./src/databases/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),   // ← this is the right place for your URL now
  },
});