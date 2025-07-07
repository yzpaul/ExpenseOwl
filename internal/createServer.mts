// src/server/createServer.ts
import http, { IncomingMessage, ServerResponse } from "http";
import path from "path";
import url from "url";
import { Config } from "./config.mjs";
import { JsonStore } from "./storage.mjs";
import { Handler } from "./api/handlers.mjs";
import { ServeTemplate } from "./web/embed.mjs";

export async function createServer(dataPath: string) {
  const cfg = new Config(dataPath);
  const storage = await JsonStore.new(path.join(cfg.StoragePath, "expenses.json"));
  const handler = new Handler(storage, cfg);

  const routes: Record<string, (req: IncomingMessage, res: ServerResponse) => Promise<void>> = {
    "/categories": handler.GetCategories.bind(handler),
    "/categories/edit": handler.EditCategories.bind(handler),
    "/currency": handler.EditCurrency.bind(handler),
    "/startdate": handler.EditStartDate.bind(handler),
    "/expense": handler.AddExpense.bind(handler),
    "/expenses": handler.GetExpenses.bind(handler),
    "/expense/edit": handler.EditExpense.bind(handler),
    "/table": handler.ServeTableView.bind(handler),
    "/settings": handler.ServeSettingsPage.bind(handler),
    "/expense/delete": handler.DeleteExpense.bind(handler),
    "/export/json": handler.exportJSON.bind(handler),
    "/import/csv": handler.importCSV.bind(handler),
    "/import/json": handler.importJSON.bind(handler),
    "/export/csv": handler.exportCSV.bind(handler),
    "/manifest.json": handler.ServeStaticFile.bind(handler),
    "/sw.js": handler.ServeStaticFile.bind(handler),
    "/style.css": handler.ServeStaticFile.bind(handler),
    "/favicon.ico": handler.ServeStaticFile.bind(handler),
    "/chart.min.js": handler.ServeStaticFile.bind(handler),
    "/fa.min.css": handler.ServeStaticFile.bind(handler),
  };

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url || "", true);
      const pathname = parsedUrl.pathname || "";

      if (pathname === "/") {
        res.setHeader("Content-Type", "text/html");
        try {
          await ServeTemplate(res, "index.html");
        } catch (err) {
          console.error("Failed to serve template:", err);
          res.statusCode = 500;
          res.end("Template error");
        }
        return;
      }

      if (pathname.startsWith("/webfonts/") || pathname.startsWith("/pwa/")) {
        await handler.ServeStaticFile(req, res);
        return;
      }

      const routeHandler = routes[pathname];
      if (routeHandler) {
        console.log(`H!!`,pathname)
        await routeHandler(req, res);
      } else {
        res.statusCode = 404;
        res.end("Not Found");
      }
    } catch (err) {
      console.error("Request error:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  return server;
}
