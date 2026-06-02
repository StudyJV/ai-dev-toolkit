import path from "node:path";
import { appendJsonl, readText } from "./fs-utils.mjs";
import { parseCsv, validateAndNormalizeEvent } from "./parser.mjs";

export function ingestFile(inputPath, storePath, strict = false) {
  const resolvedInput = path.resolve(process.cwd(), inputPath);
  const ext = path.extname(resolvedInput).toLowerCase();
  const text = readText(resolvedInput);

  let rows;
  if (ext === ".jsonl") {
    rows = text
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line, i) => {
        try {
          return JSON.parse(line);
        } catch (err) {
          throw new Error(`Invalid JSONL at line ${i + 1}: ${err.message}`);
        }
      });
  } else if (ext === ".csv") {
    rows = parseCsv(text);
  } else {
    throw new Error(`Unsupported file extension: ${ext}. Use .jsonl or .csv`);
  }

  const accepted = [];
  const rejected = [];

  for (const row of rows) {
    const result = validateAndNormalizeEvent(row);
    if (result.ok) {
      accepted.push(result.event);
    } else {
      rejected.push({ row, error: result.error });
      if (strict) {
        throw new Error(`Strict mode ingest failed: ${result.error}`);
      }
    }
  }

  if (accepted.length > 0) {
    appendJsonl(storePath, accepted);
  }

  return {
    inputPath: resolvedInput,
    storePath,
    totalRows: rows.length,
    ingestedRows: accepted.length,
    rejectedRows: rejected.length,
    rejected
  };
}
