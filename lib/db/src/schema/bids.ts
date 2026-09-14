import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { paymentStatusEnum } from "./enums";
import { dailyPiecesTable } from "./daily-pieces";
import { usersTable } from "./users";
import { paymentOrdersTable } from "./payment-orders";

export const bidsTable = pgTable(
  "bids",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id),
    dailyPieceId: uuid("daily_piece_id")
      .notNull()
      .references(() => dailyPiecesTable.id),
    amountCents: integer("amount_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    paymentReference: text("payment_reference").notNull(),
    paymentOrderId: uuid("payment_order_id").references(() => paymentOrdersTable.id),
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("pending"),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("bids_payment_reference_idx").on(table.paymentReference),
    uniqueIndex("bids_payment_order_idx").on(table.paymentOrderId),
    index("bids_user_daily_piece_idx").on(
      table.userId,
      table.dailyPieceId,
    ),
    index("bids_daily_piece_created_at_idx").on(
      table.dailyPieceId,
      table.createdAt,
    ),
    check("bids_amount_positive", sql`${table.amountCents} > 0`),
  ],
);

export const insertBidSchema = createInsertSchema(bidsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bidsTable.$inferSelect;