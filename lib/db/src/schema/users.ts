import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email").unique(),
  authProvider: text("auth_provider").notNull().default("pending"),
  authProviderId: text("auth_provider_id").unique(),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;