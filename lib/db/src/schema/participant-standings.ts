import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  primaryKey,
  timestamp,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { dailyPiecesTable } from "./daily-pieces";
import { usersTable } from "./users";

export const participantStandingsTable = pgTable(
  "participant_standings",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id),
    dailyPieceId: uuid("daily_piece_id")
      .notNull()
      .references(() => dailyPiecesTable.id),
    runningTotalCents: integer("running_total_cents").notNull().default(0),
    lastPaymentAt: timestamp("last_payment_at", { withTimezone: true }),
    standingReachedAt: timestamp("standing_reached_at", {
      withTimezone: true,
    }),
  },
  (table) => [
    primaryKey({
      name: "participant_standings_pk",
      columns: [table.userId, table.dailyPieceId],
    }),
    index("participant_standings_daily_piece_rank_idx").on(
      table.dailyPieceId,
      table.runningTotalCents,
      table.lastPaymentAt,
    ),
    check(
      "participant_standings_total_non_negative",
      sql`${table.runningTotalCents} >= 0`,
    ),
  ],
);

export const insertParticipantStandingSchema = createInsertSchema(
  participantStandingsTable,
);
export type InsertParticipantStanding = z.infer<
  typeof insertParticipantStandingSchema
>;
export type ParticipantStanding =
  typeof participantStandingsTable.$inferSelect;