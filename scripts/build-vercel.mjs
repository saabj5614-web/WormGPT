import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const templatePath = path.join(root, "chatbot", "templates", "index.html");
const outputDir = path.join(root, "public");
let backendUrl = (process.env.PANEL_BACKEND_URL || "").trim();
while (backendUrl.endsWith("/")) backendUrl = backendUrl.slice(0, -1);

if (backendUrl && !/^https:\/\//i.test(backendUrl)) {
  console.error("PANEL_BACKEND_URL must be an HTTPS URL for a public deployment.");
  process.exit(1);
}
if (!backendUrl) {
  console.warn("PANEL_BACKEND_URL is not set. The website will deploy, but AI/API calls will not work until you set it and redeploy.");
}

let html = fs.readFileSync(templatePath, "utf8");
const placeholder = 'const API_BASE = "";';
if (!html.includes(placeholder)) {
  console.error("Could not find API_BASE placeholder in chatbot/templates/index.html.");
  process.exit(1);
}
html = html.replace(placeholder, `const API_BASE = ${JSON.stringify(backendUrl)};`);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, "index.html"), html, "utf8");
console.log("Vercel frontend build complete.");
