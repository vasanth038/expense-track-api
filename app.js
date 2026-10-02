import express from "express";
import cookieParser from "cookie-parser";

import swaggerUi from "swagger-ui-express";
import spec from "./docs/swagger.js";

import { notFound, errorHandler } from "./middleWare/errorHandler.js";
import { authMiddleWare } from "./middleWare/authMiddleWare.js";

import authRoutes from "./routes/authRoutes.js";
import ExpenseRoutes from "./routes/ExpenseRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.use("/api/expenses", authMiddleWare, ExpenseRoutes);

app.use("/api/analytics", authMiddleWare, analyticsRoutes);

app.get("/api-docs.json", (req, res) => res.json(spec));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(spec, { customSiteTitle: "Expense Tracker API Docs" })
);

app.use(notFound);
app.use(errorHandler);

export default app;