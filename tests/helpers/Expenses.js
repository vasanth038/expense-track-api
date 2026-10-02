export const validExpense = { title: "Lunch", amount: 250, category: "Food" };

export const addExpense = async (agent, overrides = {}) => {
  const res = await agent.post("/api/expenses").send({ ...validExpense, ...overrides });

  if (res.status !== 201) {
    throw new Error(`addExpense failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return res.body;
};