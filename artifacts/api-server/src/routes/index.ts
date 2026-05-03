import { Router, type IRouter } from "express";
import healthRouter from "./health";
import logsRouter from "./logs";
import cyclesRouter from "./cycles";
import insightsRouter from "./insights";
import dashboardRouter from "./dashboard";
import chatRouter from "./chat";
import journalRouter from "./journal";
import bodyMapRouter from "./bodyMap";
import reportCardRouter from "./reportCard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(logsRouter);
router.use(cyclesRouter);
router.use(insightsRouter);
router.use(dashboardRouter);
router.use(chatRouter);
router.use(journalRouter);
router.use(bodyMapRouter);
router.use(reportCardRouter);

export default router;
