import { sql } from "drizzle-orm";
import {
  check,
  date,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { dailyPieceStatusEnum } from "./enums";
import { usersTable } from "./users";

export const dailyPiecesTable = pgTable(
  "daily_pieces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    closingTimestamp: timestamp("closing_timestamp", {
      withTimezone: true,
    }).notNull(),
    status: dailyPieceStatusEnum("status").notNull().default("active"),
    winnerUserId: uuid("winner_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    winningStandingCents: integer("winning_standing_cents"),
    minimumPaymentCents: integer("minimum_payment_cents")
      .notNull()
      .default(100),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("daily_pieces_date_idx").on(table.date),
    uniqueIndex("daily_pieces_one_active_idx")
      .on(table.status)
      .where(sql`${table.status} = 'active'`),
    check(
      "daily_pieces_minimum_payment_positive",
      sql`${table.minimumPaymentCents} > 0`,
    ),
    check(
      "daily_pieces_winning_standing_non_negative",
      sql`${table.winningStandingCents} IS NULL OR ${table.winningStandingCents} >= 0`,
    ),
  ],
);

export const insertDailyPieceSchema = createInsertSchema(
  dailyPiecesTable,
).omit({
  id: true,
});
export type InsertDailyPiece = z.infer<typeof insertDailyPieceSchema>;
export type DailyPiece = typeof dailyPiecesTable.$inferSelect;