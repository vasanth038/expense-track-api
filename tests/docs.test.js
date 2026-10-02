import request from "supertest";
import app from "../app.js";
import spec from "../docs/swagger.js";

const ZERO_ID = "000000000000000000000000";

const documented = Object.entries(spec.paths).flatMap(([path, methods]) =>
  Object.keys(methods).map((method) => [method, path.replace("{id}", ZERO_ID)])
);

describe("API documentation", () => {
  it("serves the OpenAPI spec as JSON", async () => {
    const res = await request(app).get("/api-docs.json");

    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.info.title).toBe("Expense Tracker API");
  });

  it("serves the Swagger UI page", async () => {
    const res = await request(app).get("/api-docs/");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });

  it("documents the routes the project requires", () => {
    expect(spec.paths["/api/auth/register"].post).toBeDefined();
    expect(spec.paths["/api/auth/login"].post).toBeDefined();
    expect(spec.paths["/api/expenses"].get).toBeDefined();
    expect(spec.paths["/api/expenses"].post).toBeDefined();
    expect(spec.paths["/api/expenses/{id}"].get).toBeDefined();
    expect(spec.paths["/api/expenses/{id}"].patch).toBeDefined();
    expect(spec.paths["/api/expenses/{id}"].delete).toBeDefined();
    expect(spec.paths["/api/analytics/monthly"].get).toBeDefined();
  });

  it.each(documented)("documented route %s %s exists in the app", async (method, path) => {
    const res = await request(app)[method](path).send({});

    expect(res.body.message ?? "").not.toMatch(/Route not found/);
  });
});