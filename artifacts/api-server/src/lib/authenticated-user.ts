import { clerkClient, getAuth } from "@clerk/express";
import type { Request } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";

/**
 * Resolve and provision the local user for a Clerk-authenticated request.
 * Keeping this in one place prevents authenticated feature routes from
 * accidentally using a different profile/email provisioning policy.
 */
export async function getAuthenticatedLocalUser(
  req: Request,
): Promise<User | null> {
  const authProviderId = getAuth(req).userId;
  if (!authProviderId) return null;

  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.authProviderId, authProviderId))
    .limit(1);

  if (!user || !user.email || user.displayName === "New participant") {
    const clerkUser = await clerkClient.users.getUser(authProviderId);
    const email =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      null;
    const clerkDisplayName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      "New participant";

    if (!user && email) {
      [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);
    }

    if (user) {
      [user] = await db
        .update(usersTable)
        .set({
          authProvider: "clerk",
          authProviderId,
          email,
          displayName:
            user.displayName === "New participant"
              ? clerkDisplayName
              : user.displayName,
        })
        .where(eq(usersTable.id, user.id))
        .returning();
    } else {
      [user] = await db
        .insert(usersTable)
        .values({
          displayName: clerkDisplayName,
          email,
          authProvider: "clerk",
          authProviderId,
        })
        .onConflictDoNothing({ target: usersTable.authProviderId })
        .returning();
    }
  }

  if (!user) {
    [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.authProviderId, authProviderId))
      .limit(1);
  }

  return user ?? null;
}