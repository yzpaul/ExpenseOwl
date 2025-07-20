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
    const [server,port] = await createServer(dataPath);
    server.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
