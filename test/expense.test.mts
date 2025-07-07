import request from "supertest";
import { Config } from "../internal/config.mjs";
import { JsonStore } from "../internal/storage.mjs";
import { Handler } from "../internal/api/handlers.mjs";
import { createServer } from "../internal/createServer.mjs";
import { IncomingMessage, Server, ServerResponse } from "http";

// Properly type the HTTP server
let server: Server<typeof IncomingMessage, typeof ServerResponse>;
let port=8002

beforeAll(async () => {
  // const cfg = new Config("data");
  // const storage = await JsonStore.new(
  //   path.join(cfg.StoragePath, "expenses.json")
  // );

  // Use the createServer util, ensure it returns a `http.Server`
  server = await createServer("../data/",port);
});

afterAll(async() => {
  await server?.close();
});

test("should add an expense and render it in the table", async () => {
  const expenseData = {
    name: "Test Lunch",
    category: "Food",
    amount: -12.5,
    date: "2025-07-07",
  };

  const putRes = await request(`http://localhost:${port}`)
    .put("/expense")
    .send(expenseData)
    .set("Content-Type", "application/json");

  expect(putRes.status).toBe(200);

  const getRes = await request(`http://localhost:${port}`)
    .get("/expenses")
    .set("Accept", "application/json");

  expect(getRes.status).toBe(200);

  const expenses = getRes.body;
  const found = expenses.some(
    (e: any) =>
      e.name === "Test Lunch" &&
      e.category === "Food" &&
      e.amount === -12.5 &&
      e.date?.startsWith("2025-07-07")
  );

  expect(found).toBe(true);
}, 10000);