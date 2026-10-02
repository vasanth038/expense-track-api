import { connectTestDB, clearDB, disconnectTestDB } from "./helpers/db.js";
import request from "supertest";
import app from "../app.js";
import { registerAgent, OTHER_USER } from "./helpers/auth.js";
import { addExpense } from "./helpers/expenses.js";

beforeAll(connectTestDB);
beforeEach(clearDB);
afterAll(disconnectTestDB);

const seedBasic = async (agent) => {
  await addExpense(agent, { title: "Lunch", amount: 250, category: "Food" });
  await addExpense(agent, { title: "Dinner", amount: 400, category: "Food" });
  await addExpense(agent, { title: "Bus", amount: 60, category: "Travel" });
  await addExpense(agent, { title: "Shoes", amount: 1500, category: "Shopping" });
};

describe("Analytics requires login", () => {
  it.each([["/api/analytics/total"], ["/api/analytics/category"], ["/api/analytics/monthly"]])(
    "GET %s returns 401 without login",
    async (path) => {
      const res = await request(app).get(path);

      expect(res.status).toBe(401);
    }
  );
});

describe("GET /api/analytics/total", () => {
  it("returns total, average and count", async () => {
    const { agent } = await registerAgent();
    await seedBasic(agent);

    const res = await agent.get("/api/analytics/total");

    expect(res.status).toBe(200);
    expect(res.body.totalAmount).toBe(2210);
    expect(res.body.averageAmount).toBe(552.5);
    expect(res.body.count).toBe(4);
  });

  it("returns zeros when the user has no expenses", async () => {
    const { agent } = await registerAgent();

    const res = await agent.get("/api/analytics/total");

    expect(res.status).toBe(200);
    expect(res.body.totalAmount).toBe(0);
    expect(res.body.averageAmount).toBe(0);
    expect(res.body.count).toBe(0);
  });

  it("only counts the caller's own expenses", async () => {
    const { agent: owner } = await registerAgent();
    const { agent: other } = await registerAgent(OTHER_USER);
    await seedBasic(owner);

    const res = await other.get("/api/analytics/total");

    expect(res.body.count).toBe(0);
    expect(res.body.totalAmount).toBe(0);
  });

  it("reflects a newly added expense", async () => {
    const { agent } = await registerAgent();
    await seedBasic(agent);
    await agent.get("/api/analytics/total");

    await addExpense(agent, { title: "Extra", amount: 90, category: "Food" });
    const res = await agent.get("/api/analytics/total");

    expect(res.body.count).toBe(5);
    expect(res.body.totalAmount).toBe(2300);
  });
});

describe("GET /api/analytics/category", () => {
  it("groups by category, biggest total first", async () => {
    const { agent } = await registerAgent();
    await seedBasic(agent);

    const res = await agent.get("/api/analytics/category");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.result)).toBe(true); 

    expect(res.body.result.map((r) => r.category)).toEqual(["Shopping", "Food", "Travel"]);

    const food = res.body.result.find((r) => r.category === "Food");
    expect(food.total).toBe(650);
    expect(food.count).toBe(2);
  });

  it("returns an empty list for a user with no expenses", async () => {
    const { agent } = await registerAgent();

    const res = await agent.get("/api/analytics/category");

    expect(res.body.result).toEqual([]);
  });

  it("only includes the caller's own expenses", async () => {
    const { agent: owner } = await registerAgent();
    const { agent: other } = await registerAgent(OTHER_USER);
    await seedBasic(owner);

    const res = await other.get("/api/analytics/category");

    expect(res.body.result).toEqual([]);
  });
});

describe("GET /api/analytics/monthly", () => {
  it("groups by year and month, oldest first", async () => {
    const { agent } = await registerAgent();
    await addExpense(agent, { amount: 100, date: "2026-08-10" });
    await addExpense(agent, { amount: 9000, date: "2026-07-05" });
    await addExpense(agent, { amount: 50, date: "2026-07-20" });

    const res = await agent.get("/api/analytics/monthly");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([
      { year: 2026, month: 7, total: 9050, count: 2 },
      { year: 2026, month: 8, total: 100, count: 1 },
    ]);
  });

  it("separates the same month in different years", async () => {
    const { agent } = await registerAgent();
    await addExpense(agent, { amount: 10, date: "2025-07-10" });
    await addExpense(agent, { amount: 20, date: "2026-07-10" });

    const res = await agent.get("/api/analytics/monthly");

    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].year).toBe(2025);
    expect(res.body.data[1].year).toBe(2026);
  });

  it("returns an empty list for a user with no expenses", async () => {
    const { agent } = await registerAgent();

    const res = await agent.get("/api/analytics/monthly");

    expect(res.body.data).toEqual([]);
  });

  it("only includes the caller's own expenses", async () => {
    const { agent: owner } = await registerAgent();
    const { agent: other } = await registerAgent(OTHER_USER);
    await addExpense(owner, { amount: 100, date: "2026-07-10" });

    const res = await other.get("/api/analytics/monthly");

    expect(res.body.data).toEqual([]);
  });
});