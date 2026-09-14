import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { dailyPiecesTable } from "./daily-pieces";
import { storiesTable } from "./stories";
import { usersTable } from "./users";
import { paymentStatusEnum } from "./enums";

/**
 * The server-side record of a Razorpay order.  Keeping the amount, currency,
 * owner and day here means a webhook can be verified without trusting browser
 * state or re-fetching mutable checkout data.
 */
export const paymentOrdersTable = pgTable(
  "payment_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storyId: uuid("story_id")
      .notNull()
      .references(() => storiesTable.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id),
    dailyPieceId: uuid("daily_piece_id")
      .notNull()
      .references(() => dailyPiecesTable.id),
    razorpayOrderId: text("razorpay_order_id").notNull(),
    razorpayPaymentId: text("razorpay_payment_id"),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    keyId: text("key_id").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("payment_orders_razorpay_order_idx").on(table.razorpayOrderId),
    uniqueIndex("payment_orders_razorpay_payment_idx").on(
      table.razorpayPaymentId,
    ),
    check("payment_orders_amount_positive", sql`${table.amountCents} > 0`),
    check("payment_orders_currency_usd", sql`${table.currency} = 'USD'`),
  ],
);

export const insertPaymentOrderSchema = createInsertSchema(
  paymentOrdersTable,
).omit({
  id: true,
  createdAt: true,
});
export type InsertPaymentOrder = z.infer<typeof insertPaymentOrderSchema>;
export type PaymentOrder = typeof paymentOrdersTable.$inferSelect;