import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storyStatusEnum } from "./enums";
import { dailyPiecesTable } from "./daily-pieces";
import { usersTable } from "./users";

export const storiesTable = pgTable(
  "stories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id),
    dailyPieceId: uuid("daily_piece_id")
      .notNull()
      .references(() => dailyPiecesTable.id),
    displayName: text("display_name").notNull(),
    storyText: text("story_text").notNull(),
    websiteUrl: text("website_url"),
    status: storyStatusEnum("status").notNull().default("visible"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("stories_user_daily_piece_idx").on(
      table.userId,
      table.dailyPieceId,
    ),
    check("stories_story_text_not_blank", sql`length(trim(${table.storyText})) > 0`),
  ],
);

export const insertStorySchema = createInsertSchema(storiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof storiesTable.$inferSelect;