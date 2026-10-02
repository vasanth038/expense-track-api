import express from "express";
import { getTotal , getByCategory , getMonthly } from "../controllers/analyticsController.js";


const router = express.Router();

router.get('/total' , getTotal);
router.get('/category',getByCategory);
router.get('/monthly',getMonthly);

export default router;