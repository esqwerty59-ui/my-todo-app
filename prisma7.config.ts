import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI（db push / migrate）は PgBouncer を経由しない直接接続を使う。
    // アプリ実行時の接続には DATABASE_URL を使う。
    url: process.env["DIRECT_URL"],
  },
});
