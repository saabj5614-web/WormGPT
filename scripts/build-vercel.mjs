import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const templatePath = path.join(root, "chatbot", "templates", "index.html");
const outputDir = path.join(root, "public");
const backendUrl = (process.env.PANEL_BACKEND_URL || "").trim().replace(/\\/+$/, "");

if (!backendUrl) {
  console.error("Missing PANEL_BACKEND_URL. Set it in Vercel Project Settings → Environment Variables.");
  process.exit(1);
}
if (!/^https:\/\//i.test(backendUrl)) {
  console.error("PANEL_BACKEND_URL must be an HTTPS URL for a public deployment.");
  process.exit(1);
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
console.log("Vercel frontend built. Backend URL is configured.");
