// internal/web.mts
import fs from "fs/promises";
import path from "path";
const templatesDir = new URL("../templates/", import.meta.url).pathname;
export async function ServeTemplate(w, templateName) {
    try {
        const templatePath = path.join(templatesDir, templateName);
        const content = await fs.readFile(templatePath);
        w.writeHead(200, { "Content-Type": "text/html" });
        w.end(content);
    }
    catch (err) {
        w.writeHead(404);
        w.end("Template not found");
        throw err;
    }
}
export async function ServeStatic(w, staticPath) {
    try {
        // staticPath is like "/js/app.js" or "/css/style.css"
        const fullPath = path.join(templatesDir, staticPath);
        const ext = path.extname(staticPath).toLowerCase();
        let contentType = "application/octet-stream";
        switch (ext) {
            case ".js":
                contentType = "application/javascript";
                break;
            case ".css":
                contentType = "text/css";
                break;
            case ".woff":
            case ".woff2":
                contentType = "font/" + ext.substring(1);
                break;
            case ".ttf":
                contentType = "font/ttf";
                break;
            case ".eot":
                contentType = "application/vnd.ms-fontobject";
                break;
            case ".svg":
                contentType = "image/svg+xml";
                break;
            case ".png":
                contentType = "image/png";
                break;
            case ".ico":
                contentType = "image/x-icon";
                break;
            case ".json":
                contentType = "application/json";
                break;
        }
        const content = await fs.readFile(fullPath);
        w.writeHead(200, { "Content-Type": contentType });
        w.end(content);
    }
    catch (err) {
        w.writeHead(404);
        w.end("File not found");
        throw err;
    }
}
