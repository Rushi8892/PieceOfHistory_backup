import { Router, type IRouter } from "express";
import { GetCurrentUserResponse } from "@workspace/api-zod";
import { getAuthenticatedLocalUser } from "../lib/authenticated-user";

const router: IRouter = Router();

router.get("/me", async (req, res): Promise<void> => {
  const user = await getAuthenticatedLocalUser(req);
  if (!user) {
    res.status(500).json({ error: "Could not provision the local user." });
    return;
  }

  res.json(GetCurrentUserResponse.parse(user));
});

export default router;