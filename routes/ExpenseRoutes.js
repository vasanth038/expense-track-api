import express from "express";
import { createExpense , getExpenses ,getExpensesByID,updateExpenseByID,deleteExpensesByID } from "../controllers/ExpenseController.js";
import { validateCreateExpense , validateUpdateExpense } from "../middleWare/validateExpense.js";

const router = express.Router();

router.post("/" , validateCreateExpense , createExpense);
router.get("/",getExpenses);
router.get("/:id" , getExpensesByID);
router.patch("/:id",validateUpdateExpense,updateExpenseByID);
router.delete("/:id",deleteExpensesByID);

export default router;