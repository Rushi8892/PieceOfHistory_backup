import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentWebhookEventsTable = pgTable(
  "payment_webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("payment_webhook_events_event_id_idx").on(table.eventId),
  ],
);

export const insertPaymentWebhookEventSchema = createInsertSchema(
  paymentWebhookEventsTable,
).omit({
  id: true,
  receivedAt: true,
});
export type InsertPaymentWebhookEvent = z.infer<
  typeof insertPaymentWebhookEventSchema
>;
export type PaymentWebhookEvent = typeof paymentWebhookEventsTable.$inferSelect;