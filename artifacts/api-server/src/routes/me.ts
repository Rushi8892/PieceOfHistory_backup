import { clerkClient, getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { GetCurrentUserResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const authProviderId = auth.userId;

  if (!authProviderId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

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

  if (!user) {
    res.status(500).json({ error: "Could not provision the local user." });
    return;
  }

  res.json(GetCurrentUserResponse.parse(user));
});

export default router;