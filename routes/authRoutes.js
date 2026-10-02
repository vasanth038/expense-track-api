import express from "express";
import {register , login , logout , getMe } from "../controllers/authController.js";
import { authMiddleWare } from "../middleWare/authMiddleWare.js";

const router = express.Router();

router.post("/register" , register);
router.post("/login",login);
router.post("/logout",logout);
router.get("/me",authMiddleWare,getMe);


export default router;