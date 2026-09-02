const { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { resolve } = require("node:path");

const root = resolve(__dirname, "..");
const output = resolve(root, "dist");
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

copyFileSync(resolve(root, "index.html"), resolve(output, "index.html"));
copyFileSync(resolve(root, "styles.css"), resolve(output, "styles.css"));
copyFileSync(resolve(root, "gradelink-static.html"), resolve(output, "gradelink-static.html"));
cpSync(resolve(root, "assets", "gradelink"), resolve(output, "assets", "gradelink"), { recursive: true });

const source = readFileSync(resolve(root, "script.js"), "utf8");
const sanitized = source.replace(
  /let announcements = \[[\s\S]*?\n\];\n\nconst state =/,
  "let announcements = [];\n\nconst state =",
);
if (sanitized === source) throw new Error("Static announcement fallback was not found; refusing to publish.");
if (sanitized.includes("assets/announcements/")) throw new Error("Static announcement assets remain in the deploy bundle.");
writeFileSync(resolve(output, "script.js"), sanitized);
