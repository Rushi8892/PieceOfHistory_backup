import type { Request, Response } from "express";
import type { User } from "@workspace/db";
import { getAuthenticatedLocalUser } from "./authenticated-user";

/**
 * Authorize owner-only routes using the role stored on the local user.
 * Authentication and authorization failures deliberately have different
 * status codes so callers can distinguish a signed-out user from a member.
 */
export async function requireAdmin(
  req: Request,
  res: Response,
): Promise<User | null> {
  const user = await getAuthenticatedLocalUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Administrator role required." });
    return null;
  }
  return user;
}