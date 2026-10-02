import { connectTestDB, clearDB, disconnectTestDB } from "./helpers/db.js";
import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import { registerAgent, TEST_USER } from "./helpers/auth.js";

beforeAll(connectTestDB);
beforeEach(clearDB);
afterAll(disconnectTestDB);

describe("POST /api/auth/register", () => {
  it("creates a user, sets an HTTP-only cookie, and hides the password", async () => {
    const res = await request(app).post("/api/auth/register").send(TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body.user.name).toBe("vasanth");
    expect(res.body.user.email).toBe("vasanth@gamil.com");
    expect(res.body.user.password).toBeUndefined();
    expect(res.headers["set-cookie"][0]).toMatch(/token=/);
    expect(res.headers["set-cookie"][0]).toMatch(/HttpOnly/);
  });

  it("stores a bcrypt hash, not the plain password", async () => {
    await request(app).post("/api/auth/register").send(TEST_USER);

    const user = await User.findOne({ email: TEST_USER.email });

    expect(user.password).not.toBe("123456");
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send(TEST_USER);
    const res = await request(app).post("/api/auth/register").send(TEST_USER);

    expect(res.status).toBe(409);
  });

  it("treats email case-insensitively when checking duplicates", async () => {
    await request(app).post("/api/auth/register").send(TEST_USER);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...TEST_USER, email: "VASANTH@GAMIL.COM" });

    expect(res.status).toBe(409);
  });

  it("rejects a short password with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...TEST_USER, password: "12345" });

    expect(res.status).toBe(400);
  });

  it("rejects missing fields with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({});

    expect(res.status).toBe(400);
  });

  it("rejects non-string input with 400 (not 500)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "vasanth", email: 5, password: "123456" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(TEST_USER);
  });

  it("logs in with correct credentials and sets a cookie", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("vasanth@gamil.com");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("accepts the email in a different case", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "VASANTH@gamil.com", password: TEST_USER.password });

    expect(res.status).toBe(200);
  });

  it("gives the same response for a wrong password and an unknown email", async () => {
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_USER.email, password: "wrongpass" });

    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@gamil.com", password: "123456" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  it("rejects missing or non-string credentials with 400", async () => {
    const empty = await request(app).post("/api/auth/login").send({});
    const object = await request(app)
      .post("/api/auth/login")
      .send({ email: { $ne: "" }, password: "123456" });

    expect(empty.status).toBe(400);
    expect(object.status).toBe(400);
  });
});

describe("GET /api/auth/me and logout", () => {
  it("returns 401 without a cookie", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
  });

  it("returns the logged-in user", async () => {
    const { agent, user } = await registerAgent();

    const res = await agent.get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.name).toBe("vasanth");
  });

  it("returns 401 for a tampered token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", ["token=this.is.not-a-real-token"]);

    expect(res.status).toBe(401);
  });

  it("returns 401 if the user was deleted after logging in", async () => {
    const { agent } = await registerAgent();

    await User.deleteMany({});
    const res = await agent.get("/api/auth/me");

    expect(res.status).toBe(401);
  });

  it("returns 401 after logout", async () => {
    const { agent } = await registerAgent();

    const logout = await agent.post("/api/auth/logout");
    const res = await agent.get("/api/auth/me");

    expect(logout.status).toBe(200);
    expect(res.status).toBe(401);
  });
});