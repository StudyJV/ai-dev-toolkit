import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { ingestFile } from "../src/ingest.mjs";
import { aggregateReport, detectAnomalies } from "../src/analytics.mjs";

function tempFile(name) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lco-"));
  return path.join(dir, name);
}

test("ingest and report over sample jsonl", () => {
  const sample = path.resolve(process.cwd(), "examples", "sample-usage.jsonl");
  const store = tempFile("events.jsonl");

  const result = ingestFile(sample, store, false);
  assert.equal(result.ingestedRows, 5);

  const report = aggregateReport(store, { groupBy: "feature" });
  assert.equal(report.totals.requests, 5);
  assert.ok(report.rows.length >= 2);
});

test("detects spend spike anomaly", () => {
  const store = tempFile("events.jsonl");
  const events = [
    { timestamp: "2026-05-20T10:00:00Z", provider: "openai", model: "gpt-4.1", feature: "a", request_id: "1", total_tokens: 100, cost_usd: 1, status: "ok", latency_ms: 1, retry_count: 0 },
    { timestamp: "2026-05-21T10:00:00Z", provider: "openai", model: "gpt-4.1", feature: "a", request_id: "2", total_tokens: 100, cost_usd: 1, status: "ok", latency_ms: 1, retry_count: 0 },
    { timestamp: "2026-05-22T10:00:00Z", provider: "openai", model: "gpt-4.1", feature: "a", request_id: "3", total_tokens: 100, cost_usd: 4, status: "ok", latency_ms: 1, retry_count: 0 }
  ];
  fs.writeFileSync(store, events.map((e) => JSON.stringify(e)).join("\n") + "\n", "utf8");

  const result = detectAnomalies(store, { threshold: 2, minDailyCost: 1 });
  assert.equal(result.anomalies.some((a) => a.type === "spend_spike"), true);
});
