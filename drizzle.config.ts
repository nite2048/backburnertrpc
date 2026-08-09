import { defineConfig } from "drizzle-kit";

export default defineConfig({
     schema: "./links/db/schema.ts",
     out: "./links/db/drizzle",
     
     dialect: "sqlite",
     
     dbCredentials: {
          url: "db.sqlite",
     },
});