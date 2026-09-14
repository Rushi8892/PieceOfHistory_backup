import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const dailyPieceStatusEnum = pgEnum("daily_piece_status", [
  "active",
  "closed",
]);
export const storyStatusEnum = pgEnum("story_status", ["visible", "hidden"]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "captured",
  "failed",
]);