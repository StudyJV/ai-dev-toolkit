import fs from "node:fs";
import path from "node:path";

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function writeText(filePath, text) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, text, "utf8");
}

export function appendJsonl(filePath, rows) {
  ensureDir(path.dirname(filePath));
  const content = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
  fs.appendFileSync(filePath, content, "utf8");
}

export function exists(filePath) {
  return fs.existsSync(filePath);
}

export function resolveStorePath(customStorePath) {
  return customStorePath
    ? path.resolve(process.cwd(), customStorePath)
    : path.resolve(process.cwd(), ".rdk", "scored-traces.jsonl");
}

export function readJsonl(filePath) {
  if (!exists(filePath)) return [];
  const text = readText(filePath).trim();
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, i) => {
      try {
        return JSON.parse(line);
      } catch (err) {
        throw new Error(`Invalid JSONL at line ${i + 1}: ${err.message}`);
      }
    });
}
