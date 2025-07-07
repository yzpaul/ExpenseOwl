// cmd/expenseowl/main.mts
import { argv } from "process";
import { createServer } from "../../internal/createServer.mjs";

function parseArgs() {
  const defaultPath = "data";
  const idx = argv.indexOf("--data");
  return idx !== -1 && argv[idx + 1] ? argv[idx + 1] : defaultPath;
}

const dataPath = parseArgs();

(async () => {
  try {
    const server = await createServer(dataPath);
    server.listen(8080, () => {
      console.log("Server listening on http://localhost:8080");
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
