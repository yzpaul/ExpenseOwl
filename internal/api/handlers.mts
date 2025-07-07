// internal/api.mts
import type { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";

import { Config,Expense } from "../config.mjs";
import { Storage, ErrExpenseNotFound } from "../storage.mjs";
import { ServeTemplate, ServeStatic } from "../web/embed.mjs";
import { ExportCSV, ExportJSON, ImportCSV, ImportJSON } from "./import-export.mjs";

interface ErrorResponse {
  error: string;
}

interface ExpenseRequest {
  name: string;
  category: string;
  amount: number;
  date: string; // ISO string
}

interface ConfigResponse {
  categories: string[];
  currency: string;
  startDate: number;
}

export class Handler {
  storage: Storage;
  config: Config;

  constructor(storage: Storage, config: Config) {
    this.storage = storage;
    this.config = config;
  }

  // Helpers
  private writeJSON(res: ServerResponse, status: number, data: unknown) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }

    exportCSV = (req: IncomingMessage, res: ServerResponse) =>
    ExportCSV.call(this, req, res);

  exportJSON = (req: IncomingMessage, res: ServerResponse) =>
    ExportJSON.call(this, req, res);

  importCSV = (req: IncomingMessage, res: ServerResponse) =>
    ImportCSV.call(this, req, res);

  importJSON = (req: IncomingMessage, res: ServerResponse) =>
    ImportJSON.call(this, req, res);


  private async parseJSON<T>(req: IncomingMessage): Promise<T> {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          resolve(JSON.parse(body) as T);
        } catch (err) {
          reject(err);
        }
      });
      req.on("error", reject);
    });
  }

  GetCategories= async(req: IncomingMessage, res: ServerResponse)=> {
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.end("Method not allowed");
      console.log("HTTP ERROR: Method not allowed");
      return;
    }
    const response: ConfigResponse = {
      categories: this.config.Categories,
      currency: this.config.Currency,
      startDate: this.config.StartDate,
    };
    this.writeJSON(res, 200, response);
  }

  EditCategories= async(req: IncomingMessage, res: ServerResponse)=> {
    if (req.method !== "PUT") {
      res.statusCode = 405;
      res.end("Method not allowed");
      console.log("HTTP ERROR: Method not allowed");
      return;
    }
    try {
      const categories = await this.parseJSON<string[]>(req);
      this.config.UpdateCategories(categories);
      this.writeJSON(res, 200, { status: "success" });
      console.log("HTTP: Updated categories");
    } catch (err) {
      this.writeJSON(res, 400, { error: "Invalid request body" });
      console.log("HTTP ERROR: Failed to decode request body:", err);
    }
  }

  EditCurrency= async(req: IncomingMessage, res: ServerResponse)=> {
    if (req.method !== "PUT") {
      res.statusCode = 405;
      res.end("Method not allowed");
      console.log("HTTP ERROR: Method not allowed");
      return;
    }
    try {
      const currency = await this.parseJSON<string>(req);
      this.config.UpdateCurrency(currency);
      this.writeJSON(res, 200, { status: "success" });
      console.log("HTTP: Updated currency");
    } catch (err) {
      this.writeJSON(res, 400, { error: "Invalid request body" });
      console.log("HTTP ERROR: Failed to decode request body:", err);
    }
  }

  EditStartDate= async(req: IncomingMessage, res: ServerResponse)=> {
    if (req.method !== "PUT") {
      res.statusCode = 405;
      res.end("Method not allowed");
      console.log("HTTP ERROR: Method not allowed");
      return;
    }
    try {
      const startDate = await this.parseJSON<number>(req);
      this.config.UpdateStartDate(startDate);
      this.writeJSON(res, 200, { status: "success" });
      console.log("HTTP: Updated start date");
    } catch (err) {
      this.writeJSON(res, 400, { error: "Invalid request body" });
      console.log("HTTP ERROR: Failed to decode request body:", err);
    }
  }

  AddExpense= async(req: IncomingMessage, res: ServerResponse)=> {
    if (req.method !== "PUT") {
      res.statusCode = 405;
      res.end("Method not allowed");
      console.log("HTTP ERROR: Method not allowed");
      return;
    }
    try {
      const reqBody = await this.parseJSON<ExpenseRequest>(req);
      let dateObj = new Date(reqBody.date);
      if (isNaN(dateObj.getTime())) dateObj = new Date(0); // invalid date fallback

      const expense = new Expense({
        name: reqBody.name,
        category: reqBody.category,
        amount: reqBody.amount,
        date: dateObj,
      });

      const validationError = expense.validate();
      if (validationError) {
        this.writeJSON(res, 400, { error: validationError });
        console.log("HTTP ERROR: Failed to validate expense:", validationError);
        return;
      }

      await this.storage.saveExpense(expense);
      this.writeJSON(res, 200, expense);
    } catch (err) {
      this.writeJSON(res, 400, { error: "Invalid request body or failed to save expense"+JSON.stringify(err) });
      console.log("HTTP ERROR: Failed to decode or save expense:", err);
    }
  }

  EditExpense= async(req: IncomingMessage, res: ServerResponse)=> {
    if (req.method !== "PUT") {
      res.statusCode = 405;
      res.end("Method not allowed");
      console.log("HTTP ERROR: Method not allowed");
      return;
    }
    const parsedUrl = new URL(req.url ?? "", "http://localhost");
    const id = parsedUrl.searchParams.get("id");
    if (!id) {
      this.writeJSON(res, 400, { error: "ID parameter is required" });
      console.log("HTTP ERROR: ID parameter is required");
      return;
    }
    try {
      const reqBody = await this.parseJSON<ExpenseRequest>(req);
      let dateObj = new Date(reqBody.date);
      if (isNaN(dateObj.getTime())) dateObj = new Date(0);

      const expense = new Expense({
        id,
        name: reqBody.name,
        category: reqBody.category,
        amount: reqBody.amount,
        date: dateObj,
      });

      const validationError = expense.validate();
      if (validationError) {
        this.writeJSON(res, 400, { error: validationError });
        console.log("HTTP ERROR: Failed to validate expense:", validationError);
        return;
      }

      try {
        await this.storage.editExpense(expense);
      } catch (err) {
        if (err === ErrExpenseNotFound) {
          this.writeJSON(res, 404, { error: "Expense not found" });
          return;
        }
        this.writeJSON(res, 500, { error: "Failed to edit expense" });
        console.log("HTTP ERROR: Failed to edit expense:", err);
        return;
      }

      this.writeJSON(res, 200, expense);
      console.log(`HTTP: Edited expense with ID ${id}`);
    } catch (err) {
      this.writeJSON(res, 400, { error: "Invalid request body" });
      console.log("HTTP ERROR: Failed to decode request body:", err);
    }
  }

  GetExpenses= async(req: IncomingMessage, res: ServerResponse)=> {
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.end("Method not allowed");
      console.log("HTTP ERROR: Method not allowed");
      return;
    }
    try {
      const expenses = await this.storage.getAllExpenses();
      this.writeJSON(res, 200, expenses);
    } catch (err) {
      this.writeJSON(res, 500, { error: "Failed to retrieve expenses" });
      console.log("HTTP ERROR: Failed to retrieve expenses:", err);
    }
  }

  ServeTableView= async(req: IncomingMessage, res: ServerResponse)=> {
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.end("Method not allowed");
      console.log("HTTP ERROR: Method not allowed");
      return;
    }
    res.setHeader("Content-Type", "text/html");
    try {
      await ServeTemplate(res, "table.html");
    } catch (err) {
      res.statusCode = 500;
      res.end("Failed to serve template");
      console.log("HTTP ERROR: Failed to serve template:", err);
    }
  }

  ServeSettingsPage= async(req: IncomingMessage, res: ServerResponse)=> {
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.end("Method not allowed");
      console.log("HTTP ERROR: Method not allowed");
      return;
    }
    res.setHeader("Content-Type", "text/html");
    try {
      await ServeTemplate(res, "settings.html");
    } catch (err) {
      res.statusCode = 500;
      res.end("Failed to serve template");
      console.log("HTTP ERROR: Failed to serve template:", err);
    }
  }

  DeleteExpense= async(req: IncomingMessage, res: ServerResponse)=> {
    if (req.method !== "DELETE") {
      res.statusCode = 405;
      res.end("Method not allowed");
      console.log("HTTP ERROR: Method not allowed");
      return;
    }
    const parsedUrl = new URL(req.url ?? "", "http://localhost");
    const id = parsedUrl.searchParams.get("id");
    if (!id) {
      this.writeJSON(res, 400, { error: "ID parameter is required" });
      console.log("HTTP ERROR: ID parameter is required");
      return;
    }
    try {
      await this.storage.deleteExpense(id);
      this.writeJSON(res, 200, { status: "success" });
      console.log(`HTTP: Deleted expense with ID ${id}`);
    } catch (err) {
      if (err === ErrExpenseNotFound) {
        this.writeJSON(res, 404, { error: "Expense not found" });
        console.log("HTTP ERROR: Expense not found:", err);
        return;
      }
      this.writeJSON(res, 500, { error: "Failed to delete expense" });
      console.log("HTTP ERROR: Failed to delete expense:", err);
    }
  }

  ServeStaticFile= async(req: IncomingMessage, res: ServerResponse)=> {
    if (req.method !== "GET") {
      res.statusCode = 405;
      res.end("Method not allowed");
      console.log("HTTP ERROR: Method not allowed");
      return;
    }
    try {
      await ServeStatic(res, req.url || "");
    } catch (err) {
      res.statusCode = 500;
      res.end("Failed to serve static file");
      console.log(`HTTP ERROR: Failed to serve static file ${req.url}:`, err);
    }
  }
}
