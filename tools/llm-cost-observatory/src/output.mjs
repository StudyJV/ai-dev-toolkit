import { writeText } from "./fs-utils.mjs";
import { toCsv } from "./analytics.mjs";

export function printReport(report) {
  console.log(`Report grouped by '${report.groupBy}'${report.window ? `, window=${report.window}` : ""}`);
  console.log(`Generated at: ${report.generated_at}`);
  console.log("");
  console.table(
    report.rows.map((r) => ({
      key: r.key,
      requests: r.requests,
      errors: r.errors,
      error_rate: r.error_rate,
      total_tokens: r.total_tokens,
      total_cost_usd: r.total_cost_usd,
      avg_latency_ms: r.avg_latency_ms,
      retry_rate: r.retry_rate
    }))
  );
  console.log("Totals:", report.totals);
}

export function printAnomalies(result) {
  console.log(`Anomalies${result.window ? ` (window=${result.window})` : ""}`);
  if (!result.anomalies.length) {
    console.log("No anomalies detected.");
    return;
  }
  console.table(result.anomalies);
}

export function exportOutput(data, format, outputPath) {
  const chosen = format || "json";
  if (chosen === "json") {
    const text = JSON.stringify(data, null, 2) + "\n";
    if (outputPath) writeText(outputPath, text);
    return text;
  }

  if (chosen === "csv") {
    const rows = Array.isArray(data) ? data : data.rows || data.anomalies || [];
    const text = toCsv(rows);
    if (outputPath) writeText(outputPath, text);
    return text;
  }

  throw new Error(`Unsupported export format: ${format}`);
}
