import { connectTestDB, clearDB, disconnectTestDB } from "./helpers/db.js";
import request from "supertest";
import app from "../app.js";
import Expense from "../models/Expense.js";
import { registerAgent, OTHER_USER } from "./helpers/auth.js";
import { validExpense, addExpense } from "./helpers/expenses.js";

beforeAll(connectTestDB);
beforeEach(clearDB);
afterAll(disconnectTestDB);

const ZERO_ID = "000000000000000000000000";

describe("Authentication on expense routes", () => {
  const routes = [
    ["get", "/api/expenses"],
    ["post", "/api/expenses"],
    ["get", `/api/expenses/${ZERO_ID}`],
    ["patch", `/api/expenses/${ZERO_ID}`],
    ["delete", `/api/expenses/${ZERO_ID}`],
  ];

  it.each(routes)("%s %s returns 401 without login", async (method, path) => {
    const res = await request(app)[method](path).send({});

    expect(res.status).toBe(401);
  });
});

describe("Create expense", () => {
  it("creates an expense owned by the logged-in user", async () => {
    const { agent, user } = await registerAgent();

    const res = await agent.post("/api/expenses").send(validExpense);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Lunch");
    expect(res.body.amount).toBe(250);
    expect(res.body.category).toBe("Food");
    expect(res.body.user).toBe(user.id);
    expect(res.body.date).toBeDefined();
  });

  it("trims the title", async () => {
    const { agent } = await registerAgent();

    const res = await agent.post("/api/expenses").send({ ...validExpense, title: "   Coffee   " });

    expect(res.body.title).toBe("Coffee");
  });

  it("accepts an amount of 0", async () => {
    const { agent } = await registerAgent();

    const res = await agent.post("/api/expenses").send({ ...validExpense, amount: 0 });

    expect(res.status).toBe(201);
  });

  it("accepts a numeric string amount and stores a number", async () => {
    const { agent } = await registerAgent();

    const res = await agent.post("/api/expenses").send({ ...validExpense, amount: "250" });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(250);
  });

  it("returns every validation error for an empty body, and saves nothing", async () => {
    const { agent } = await registerAgent();

    const res = await agent.post("/api/expenses").send({});

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveLength(3);
    expect(await Expense.countDocuments()).toBe(0);
  });

  it("rejects a negative amount", async () => {
    const { agent } = await registerAgent();

    const res = await agent.post("/api/expenses").send({ ...validExpense, amount: -5 });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe("amount");
  });

  it("rejects a non-numeric amount", async () => {
    const { agent } = await registerAgent();

    const res = await agent.post("/api/expenses").send({ ...validExpense, amount: "abc" });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe("amount");
  });

  it("ignores a forged user field", async () => {
    const { agent, user } = await registerAgent();

    const res = await agent.post("/api/expenses").send({ ...validExpense, user: ZERO_ID });

    expect(res.status).toBe(201);
    expect(res.body.user).toBe(user.id);
  });
});

describe("Read one expense", () => {
  it("gets an expense by id", async () => {
    const { agent } = await registerAgent();
    const created = await addExpense(agent);

    const res = await agent.get(`/api/expenses/${created._id}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Lunch");
  });

  it("returns 400 for an invalid id", async () => {
    const { agent } = await registerAgent();

    const res = await agent.get("/api/expenses/abc");

    expect(res.status).toBe(400);
  });

  it("returns 404 for a valid id that does not exist", async () => {
    const { agent } = await registerAgent();

    const res = await agent.get(`/api/expenses/${ZERO_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("Update expense", () => {
  it("updates only the fields that were sent", async () => {
    const { agent } = await registerAgent();
    const created = await addExpense(agent);

    const res = await agent.patch(`/api/expenses/${created._id}`).send({ amount: 300 });

    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(300); // updated version is returned
    expect(res.body.title).toBe("Lunch");
    expect(res.body.category).toBe("Food");
  });

  it("trims updated text", async () => {
    const { agent } = await registerAgent();
    const created = await addExpense(agent);

    const res = await agent.patch(`/api/expenses/${created._id}`).send({ title: "  Team Lunch  " });

    expect(res.body.title).toBe("Team Lunch");
  });

  it("rejects a negative amount", async () => {
    const { agent } = await registerAgent();
    const created = await addExpense(agent);

    const res = await agent.patch(`/api/expenses/${created._id}`).send({ amount: -50 });

    expect(res.status).toBe(400);
  });

  it("rejects an empty title", async () => {
    const { agent } = await registerAgent();
    const created = await addExpense(agent);

    const res = await agent.patch(`/api/expenses/${created._id}`).send({ title: "" });

    expect(res.status).toBe(400);
  });

  it("cannot reassign ownership through the body", async () => {
    const { agent, user } = await registerAgent();
    const created = await addExpense(agent);

    const res = await agent.patch(`/api/expenses/${created._id}`).send({ user: ZERO_ID });

    expect(res.status).toBe(200);
    expect(res.body.user).toBe(user.id);
  });

  it("ignores unknown fields", async () => {
    const { agent } = await registerAgent();
    const created = await addExpense(agent);

    const res = await agent.patch(`/api/expenses/${created._id}`).send({ color: "red" });

    expect(res.status).toBe(200);
    expect(res.body.color).toBeUndefined();
  });

  it("returns 404 for an expense that does not exist", async () => {
    const { agent } = await registerAgent();

    const res = await agent.patch(`/api/expenses/${ZERO_ID}`).send({ amount: 1 });

    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid id", async () => {
    const { agent } = await registerAgent();

    const res = await agent.patch("/api/expenses/abc").send({ amount: 1 });

    expect(res.status).toBe(400);
  });
});

describe("Delete expense", () => {
  it("deletes an expense, and a second delete gives 404", async () => {
    const { agent } = await registerAgent();
    const created = await addExpense(agent);

    const first = await agent.delete(`/api/expenses/${created._id}`);
    const second = await agent.delete(`/api/expenses/${created._id}`);
    const get = await agent.get(`/api/expenses/${created._id}`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(404);
    expect(get.status).toBe(404);
  });

  it("returns 400 for an invalid id", async () => {
    const { agent } = await registerAgent();

    const res = await agent.delete("/api/expenses/abc");

    expect(res.status).toBe(400);
  });
});

describe("Authorization (users cannot touch each other's expenses)", () => {
  it("hides, blocks edits to, and blocks deletes of another user's expense", async () => {
    const { agent: owner } = await registerAgent();
    const { agent: intruder } = await registerAgent(OTHER_USER);
    const created = await addExpense(owner);
    const id = created._id;

    const get = await intruder.get(`/api/expenses/${id}`);
    const patch = await intruder.patch(`/api/expenses/${id}`).send({ amount: 1 });
    const del = await intruder.delete(`/api/expenses/${id}`);

    expect(get.status).toBe(404);
    expect(patch.status).toBe(404);
    expect(del.status).toBe(404);

    // The owner's expense is untouched
    const still = await owner.get(`/api/expenses/${id}`);
    expect(still.status).toBe(200);
    expect(still.body.amount).toBe(250);
  });

  it("lists only the caller's own expenses", async () => {
    const { agent: owner } = await registerAgent();
    const { agent: other } = await registerAgent(OTHER_USER);

    await addExpense(owner);
    await addExpense(owner);

    const ownerList = await owner.get("/api/expenses");
    const otherList = await other.get("/api/expenses");

    expect(ownerList.body.total).toBe(2);
    expect(otherList.body.total).toBe(0);
    expect(otherList.body.data).toEqual([]);
  });

  it("does not leak another user's expenses through filters or search", async () => {
    const { agent: owner } = await registerAgent();
    const { agent: other } = await registerAgent(OTHER_USER);

    await addExpense(owner, { title: "Secret lunch", category: "Food" });

    const byCategory = await other.get("/api/expenses?category=Food");
    const bySearch = await other.get("/api/expenses?search=secret");

    expect(byCategory.body.total).toBe(0);
    expect(bySearch.body.total).toBe(0);
  });
});

describe("Pagination", () => {
  // 7 expenses with fixed dates: Item 1 is the oldest, Item 7 the newest
  const seed = async (agent) => {
    for (let i = 1; i <= 7; i++) {
      await addExpense(agent, {
        title: `Item ${i}`,
        amount: i * 10,
        category: "Food",
        date: `2026-01-0${i}`,
      });
    }
  };

  it("returns the right page and metadata", async () => {
    const { agent } = await registerAgent();
    await seed(agent);

    const page1 = await agent.get("/api/expenses?page=1&limit=3");
    const page3 = await agent.get("/api/expenses?page=3&limit=3");

    expect(page1.status).toBe(200);
    expect(page1.body.data).toHaveLength(3);
    expect(page1.body.page).toBe(1);
    expect(page1.body.limit).toBe(3);
    expect(page1.body.total).toBe(7);
    expect(page1.body.totalPages).toBe(3);
    expect(page3.body.data).toHaveLength(1); // the remainder
  });

  it("uses limit 5 and page 1 by default", async () => {
    const { agent } = await registerAgent();
    await seed(agent);

    const res = await agent.get("/api/expenses");

    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(5);
    expect(res.body.data).toHaveLength(5);
  });

  it("sorts newest first by default", async () => {
    const { agent } = await registerAgent();
    await seed(agent);

    const res = await agent.get("/api/expenses?limit=3");

    expect(res.body.data.map((e) => e.title)).toEqual(["Item 7", "Item 6", "Item 5"]);
  });

  it("never repeats an item across pages", async () => {
    const { agent } = await registerAgent();
    await seed(agent);

    const p1 = await agent.get("/api/expenses?page=1&limit=3");
    const p2 = await agent.get("/api/expenses?page=2&limit=3");
    const p3 = await agent.get("/api/expenses?page=3&limit=3");

    const ids = [...p1.body.data, ...p2.body.data, ...p3.body.data].map((e) => e._id);

    expect(ids).toHaveLength(7);
    expect(new Set(ids).size).toBe(7);
  });

  it("returns an empty page (not an error) past the end", async () => {
    const { agent } = await registerAgent();
    await seed(agent);

    const res = await agent.get("/api/expenses?page=99&limit=3");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.total).toBe(7);
  });

  it("returns total 0 and totalPages 0 when there is nothing", async () => {
    const { agent } = await registerAgent();

    const res = await agent.get("/api/expenses");

    expect(res.body.total).toBe(0);
    expect(res.body.totalPages).toBe(0);
  });

  it("caps limit at 100", async () => {
    const { agent } = await registerAgent();

    const res = await agent.get("/api/expenses?limit=5000");

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(100);
  });

  it.each([["page=abc"], ["page=0"], ["page=-1"], ["limit=0"], ["limit=abc"], ["limit=1.5"]])(
    "rejects invalid query %s with 400",
    async (query) => {
      const { agent } = await registerAgent();

      const res = await agent.get(`/api/expenses?${query}`);

      expect(res.status).toBe(400);
    }
  );
});

describe("Sorting", () => {
  it("sorts by amount ascending and descending", async () => {
    const { agent } = await registerAgent();
    await addExpense(agent, { title: "B", amount: 20 });
    await addExpense(agent, { title: "A", amount: 10 });
    await addExpense(agent, { title: "C", amount: 30 });

    const asc = await agent.get("/api/expenses?sort=amount");
    const desc = await agent.get("/api/expenses?sort=-amount");

    expect(asc.body.data.map((e) => e.amount)).toEqual([10, 20, 30]);
    expect(desc.body.data.map((e) => e.amount)).toEqual([30, 20, 10]);
  });

  it("sorts by title", async () => {
    const { agent } = await registerAgent();
    await addExpense(agent, { title: "Banana" });
    await addExpense(agent, { title: "Apple" });
    await addExpense(agent, { title: "Cherry" });

    const res = await agent.get("/api/expenses?sort=title");

    expect(res.body.data.map((e) => e.title)).toEqual(["Apple", "Banana", "Cherry"]);
  });

  it("sorts by date", async () => {
    const { agent } = await registerAgent();
    await addExpense(agent, { title: "Mar", date: "2026-03-01" });
    await addExpense(agent, { title: "Jan", date: "2026-01-01" });
    await addExpense(agent, { title: "Feb", date: "2026-02-01" });

    const asc = await agent.get("/api/expenses?sort=date");

    expect(asc.body.data.map((e) => e.title)).toEqual(["Jan", "Feb", "Mar"]);
  });

  it.each([["password"], ["-password"], ["category"], ["_id"]])(
    "rejects the unsafe sort field %s with 400",
    async (field) => {
      const { agent } = await registerAgent();

      const res = await agent.get(`/api/expenses?sort=${field}`);

      expect(res.status).toBe(400);
    }
  );
});

describe("Filtering", () => {
  it("filters by category and updates the total", async () => {
    const { agent } = await registerAgent();
    await addExpense(agent, { title: "Lunch", amount: 100, category: "Food" });
    await addExpense(agent, { title: "Dinner", amount: 200, category: "Food" });
    await addExpense(agent, { title: "Bus", amount: 50, category: "Travel" });

    const res = await agent.get("/api/expenses?category=Food");

    expect(res.body.total).toBe(2);
    expect(res.body.data.every((e) => e.category === "Food")).toBe(true);
  });

  it("returns an empty result for an unknown category", async () => {
    const { agent } = await registerAgent();
    await addExpense(agent);

    const res = await agent.get("/api/expenses?category=Nothing");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.data).toEqual([]);
  });

  it("combines filter, sort and pagination", async () => {
    const { agent } = await registerAgent();
    await addExpense(agent, { title: "A", amount: 10, category: "Food" });
    await addExpense(agent, { title: "B", amount: 30, category: "Food" });
    await addExpense(agent, { title: "C", amount: 20, category: "Food" });
    await addExpense(agent, { title: "D", amount: 999, category: "Travel" });

    const res = await agent.get("/api/expenses?category=Food&page=1&limit=2&sort=-amount");

    expect(res.body.total).toBe(3); 
    expect(res.body.totalPages).toBe(2);
    expect(res.body.data.map((e) => e.amount)).toEqual([30, 20]);
  });

  it("does not treat bracket query keys as MongoDB operators", async () => {
    const { agent } = await registerAgent();
    await addExpense(agent, { title: "Lunch", category: "Food" });
    await addExpense(agent, { title: "Bus", category: "Travel" });

    const res = await agent.get("/api/expenses?category[$ne]=Food");

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2); 
  });
});

describe("Search", () => {
  it("searches titles case-insensitively and by partial match", async () => {
    const { agent } = await registerAgent();
    await addExpense(agent, { title: "Team Lunch" });
    await addExpense(agent, { title: "lunch box" });
    await addExpense(agent, { title: "Bus" });

    const lower = await agent.get("/api/expenses?search=lunch");
    const upper = await agent.get("/api/expenses?search=LUNCH");

    expect(lower.body.total).toBe(2);
    expect(upper.body.total).toBe(2);
  });

  it("treats special characters as plain text (no regex crash)", async () => {
    const { agent } = await registerAgent();
    await addExpense(agent, { title: "a.b" });
    await addExpense(agent, { title: "axb" });

    const dot = await agent.query({ search: "a.b" }).get("/api/expenses");
    const paren = await agent.query({ search: "(" }).get("/api/expenses");

    expect(dot.status).toBe(200);
    expect(dot.body.total).toBe(1); // "a.b" matches literally, not "axb"
    expect(paren.status).toBe(200);
    expect(paren.body.total).toBe(0);
  });

  it("combines search with category", async () => {
    const { agent } = await registerAgent();
    await addExpense(agent, { title: "Lunch", category: "Food" });
    await addExpense(agent, { title: "Lunch trip", category: "Travel" });

    const res = await agent.get("/api/expenses?search=lunch&category=Food");

    expect(res.body.total).toBe(1);
    expect(res.body.data[0].category).toBe("Food");
  });
});