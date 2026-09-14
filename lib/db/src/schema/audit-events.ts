import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { dailyPiecesTable } from "./daily-pieces";
import { usersTable } from "./users";

export const auditEventsTable = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventType: text("event_type").notNull(),
  dailyPieceId: uuid("daily_piece_id").references(() => dailyPiecesTable.id),
  actorUserId: uuid("actor_user_id").references(() => usersTable.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertAuditEventSchema = createInsertSchema(auditEventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;
export type AuditEvent = typeof auditEventsTable.$inferSelect;