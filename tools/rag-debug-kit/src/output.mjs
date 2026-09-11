import { writeText } from "./fs-utils.mjs";
import { toCsv } from "./analytics.mjs";

export function printReport(report) {
  console.log(`RAG report grouped by '${report.groupBy}'`);
  console.log(`Generated at: ${report.generated_at}`);
  console.log("");
  console.table(report.rows);
  console.log("Totals:", report.totals);
}

export function printFailures(result) {
  console.log(`Failures (type=${result.type}) - ${result.count} trace(s)`);
  if (!result.count) {
    console.log("No failing traces.");
    return;
  }
  console.table(result.failures);
}

export function exportOutput(data, format, outputPath) {
  const chosen = format || "json";
  if (chosen === "json") {
    const text = JSON.stringify(data, null, 2) + "\n";
    if (outputPath) writeText(outputPath, text);
    return text;
  }

  if (chosen === "csv") {
    const rows = Array.isArray(data) ? data : data.rows || data.failures || [];
    const text = toCsv(rows);
    if (outputPath) writeText(outputPath, text);
    return text;
  }

  throw new Error(`Unsupported export format: ${format}`);
}
