import { Router, type IRouter } from "express";
import healthRouter from "./health";
import skilltankRouter from "./skilltank";

const router: IRouter = Router();

router.use(healthRouter);
router.use(skilltankRouter);

export default router;
