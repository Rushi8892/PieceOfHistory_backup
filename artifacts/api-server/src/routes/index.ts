import { Router, type IRouter } from "express";
import healthRouter from "./health";
import statsRouter from "./stats";
import competitionRouter from "./competition";
import meRouter from "./me";

const router: IRouter = Router();

router.use(healthRouter);
router.use(statsRouter);
router.use(competitionRouter);
router.use(meRouter);

export default router;
