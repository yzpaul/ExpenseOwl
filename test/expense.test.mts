import request from "supertest";
import { createServer } from "http";
import path from "path";
import * as cheerio from "cheerio";

import { Config } from "../internal/config.mjs";
import { JsonStore } from "../internal/storage.mjs";
import { Handler } from "../internal/api/handlers.mjs";

let server: ReturnType<typeof createServer>;

beforeAll(async () => {
  const cfg = new Config("data");
  const storage = await JsonStore.new(
    path.join(cfg.StoragePath, "expenses.json")
  );
  const handler = new Handler(storage, cfg);

  server = createServer(async (req: any, res) => {
    try {
      const url = new URL(req.url ?? "", `http://${req.headers.host}`);
      if (req.method === "PUT" && url.pathname === "/expense") {
        await handler.AddExpense(req, res);
      } else if (req.method === "GET" && url.pathname === "/table") {
        await handler.ServeTableView(req, res);
      } else {
        res.writeHead(404);
        res.end("Not Found");
      }
    } catch (err) {
      console.error("Server handler error:", err);
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  });

  await new Promise<void>((resolve) => server.listen(8081, resolve));
});

afterAll(() => {
  server.close();
});

test("should add an expense and render it in the table", async () => {
  // Add expense--------------------
  const expenseData = {
    name: "Test Lunch",
    category: "Food",
    amount: -12.5,
    date: "2025-07-07",
  };
  console.log(`HHHH`);

  const putRes = await request("http://localhost:8081")
    .put("/expense")
    .send(expenseData)
    .set("Content-Type", "application/json");

  expect(putRes.status).toBe(200);

  // get the json back form the API (make sure the record got inserted)-----------
  //OR USE PUPPETEER TO Fetch the HTML table
  const getRes = await request("http://localhost:8081")
    .get("/expenses")
    .set("Accept", "application/json");

  expect(getRes.status).toBe(200);
  const expenses = getRes.body;
  const found = expenses.some(
    (e: any) =>
      e.name === "Test Lunch" &&
      e.category === "Food" &&
      e.amount === -12.5 &&
      e.date.startsWith("2025-07-07")
  );

  expect(found).toBe(true);
}, 10000);
