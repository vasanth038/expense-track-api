import request from "supertest";
import app from "../../app.js";

export const TEST_USER = {
  name: "vasanth",
  email: "vasanth@gamil.com",
  password: "123456",
};

export const OTHER_USER = {
  name: "other",
  email: "other@gamil.com",
  password: "123456",
};

export const registerAgent = async (credentials = TEST_USER) => {
  const agent = request.agent(app);

  const res = await agent.post("/api/auth/register").send(credentials);

  if (res.status !== 201) {
    throw new Error(`registerAgent failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return { agent, user: res.body.user };
};