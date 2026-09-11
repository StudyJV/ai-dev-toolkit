import path from "node:path";
import { appendJsonl, readText } from "./fs-utils.mjs";
import { validateAndNormalizeTrace } from "./parser.mjs";
import { scoreTrace } from "./metrics.mjs";

export function analyzeFile(inputPath, storePath, options = {}) {
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
  } else if (ext === ".json") {
    const parsed = JSON.parse(text);
    rows = Array.isArray(parsed) ? parsed : [parsed];
  } else {
    throw new Error(`Unsupported file extension: ${ext}. Use .jsonl or .json`);
  }

  const scored = [];
  const rejected = [];

  for (const row of rows) {
    let result;
    try {
      result = validateAndNormalizeTrace(row);
    } catch (err) {
      result = { ok: false, error: err.message };
    }

    if (result.ok) {
      scored.push(scoreTrace(result.trace, options));
    } else {
      rejected.push({ row, error: result.error });
      if (options.strict) {
        throw new Error(`Strict mode analyze failed: ${result.error}`);
      }
    }
  }

  if (scored.length > 0) {
    appendJsonl(storePath, scored);
  }

  return {
    inputPath: resolvedInput,
    storePath,
    totalRows: rows.length,
    scoredRows: scored.length,
    rejectedRows: rejected.length,
    rejected
  };
}
