// main.mts
import http from "http";
import path from "path";
import url from "url";
import { argv } from "process";

import { Config } from "../../internal/config.mjs";
import { JsonStore } from "../../internal/storage.mjs";
import { Handler } from "../../internal/api/handlers.mjs";
import { ServeTemplate } from "../../internal/web/embed.mjs";

async function runServer(dataPath: string) {
  const cfg = new Config(dataPath);

    try {
      let storage=await JsonStore.new(path.join(cfg.StoragePath, "expenses.json"))
      const handler = new Handler(storage, cfg);

      const server = http.createServer(async (req, res) => {
        const parsedUrl = url.parse(req.url || "", true);
        const pathname = parsedUrl.pathname || "";

        // Helper for routing
        const routes: Record<string, (req: http.IncomingMessage, res: http.ServerResponse) => void> = {
          "/categories": handler.GetCategories,
          "/categories/edit": handler.EditCategories,
          "/currency": handler.EditCurrency,
          "/startdate": handler.EditStartDate,
          "/expense": handler.AddExpense,
          "/expenses": handler.GetExpenses,
          "/expense/edit": handler.EditExpense,
          "/table": handler.ServeTableView,
          "/settings": handler.ServeSettingsPage,
          "/expense/delete": handler.DeleteExpense,
          "/export/json": handler.exportJSON,
          "/import/csv": handler.importCSV,
          "/import/json": handler.importJSON,
          "/export/csv": handler.exportCSV,
          "/manifest.json": handler.ServeStaticFile,
          "/sw.js": handler.ServeStaticFile, 
          "/style.css": handler.ServeStaticFile,
          "/favicon.ico": handler.ServeStaticFile,
          "/chart.min.js": handler.ServeStaticFile,
          "/fa.min.css": handler.ServeStaticFile,
        };

        if (pathname.startsWith("/pwa/")) {
          handler.ServeStaticFile(req, res);
          return;
        }

        // Serve webfonts folder files
        if (pathname.startsWith("/webfonts/")) {
          handler.ServeStaticFile(req, res);
          return;
        }

        if (pathname === "/") {
          res.setHeader("Content-Type", "text/html");
          try {
            await ServeTemplate(res, "index.html");
          } catch (err) {
            console.error("HTTP ERROR: Failed to serve template:", err);
            res.statusCode = 500;
            res.end("Failed to serve template");
          }
          return;
        }

        const routeHandler = routes[pathname];
        if (routeHandler) {
          routeHandler(req, res);
          return;
        }

        // Not found
        res.statusCode = 404;
        res.end("Not Found");
      });

      server.listen(Number(cfg.ServerPort), () => {
        console.log(`Starting server on port ${cfg.ServerPort}...`);
      });

      server.on("error", (err) => {
        console.error("Server failed to start:", err);
        process.exit(1);
      });
    
    }catch(err:any){
      console.error("Failed to initialize storage:", err);
      process.exit(1);
    };
}

function parseArgs() {
  // Simple arg parsing for --data argument
  const defaultPath = "data";
  const dataFlagIndex = argv.findIndex((a) => a === "--data");
  if (dataFlagIndex !== -1 && argv.length > dataFlagIndex + 1) {
    return argv[dataFlagIndex + 1];
  }
  return defaultPath;
}

const dataPath = parseArgs();
runServer(dataPath);
