import { Router, type IRouter } from "express";
import healthRouter from "./health";
import statsRouter from "./stats";
import competitionRouter from "./competition";
import meRouter from "./me";
import storiesRouter from "./stories";
import paymentsRouter from "./payments";
import archiveRouter from "./archive";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(statsRouter);
router.use(competitionRouter);
router.use(meRouter);
router.use(storiesRouter);
router.use(paymentsRouter);
router.use(archiveRouter);
router.use(adminRouter);

export default router;
