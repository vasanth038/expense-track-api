import { jest } from "@jest/globals";
import request from "supertest";
import app from "../app.js";
import { AppError, errorHandler, notFound } from "../middleWare/errorHandler.js";

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("errorHandler (unit tests)", () => {
  it("uses the status code and message of an AppError", () => {
    const res = mockRes();

    errorHandler(new AppError("Expense not found", 404), {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Expense not found" });
  });

  it("turns a Mongoose ValidationError into 400", () => {
    const res = mockRes();

    errorHandler({ name: "ValidationError", message: "amount is too small" }, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "amount is too small" });
  });

  it("turns a Mongoose CastError into 400", () => {
    const res = mockRes();

    errorHandler({ name: "CastError", message: "bad id" }, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("turns a JSON parse failure into 400", () => {
    const res = mockRes();

    errorHandler({ type: "entity.parse.failed" }, {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid JSON in request body",
    });
  });

  it("hides the details of unexpected errors and logs them instead", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = mockRes();

    errorHandler(new Error("secret database detail"), {}, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Server error" });
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});

describe("notFound (unit test)", () => {
  it("passes a 404 AppError to next()", () => {
    const next = jest.fn();

    notFound({ method: "GET", originalUrl: "/nope" }, {}, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
  });
});

describe("Error handling through the real app (integration)", () => {
  it("returns a JSON 404 for an unknown route", async () => {
    const res = await request(app).get("/api/nothing");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Route not found/);
  });

  it("returns 400 for a broken JSON body", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{ "email": "vasanth@gamil.com", }'); 

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid JSON in request body");
  });
});