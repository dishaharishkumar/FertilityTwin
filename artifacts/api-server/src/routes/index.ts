import { Router, type IRouter } from "express";
import healthRouter from "./health";
import logsRouter from "./logs";
import cyclesRouter from "./cycles";
import insightsRouter from "./insights";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(logsRouter);
router.use(cyclesRouter);
router.use(insightsRouter);
router.use(dashboardRouter);

export default router;
