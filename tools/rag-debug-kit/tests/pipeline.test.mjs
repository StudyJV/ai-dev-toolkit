import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeFile } from "../src/analyze.mjs";
import { aggregateReport, listFailures } from "../src/analytics.mjs";

function tmpStore() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "rdk-")), "scored.jsonl");
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE = path.resolve(HERE, "../examples/sample-traces.jsonl");

test("analyze scores every valid trace from the sample file", () => {
  const store = tmpStore();
  const result = analyzeFile(SAMPLE, store, { k: 5 });
  assert.equal(result.rejectedRows, 0);
  assert.equal(result.scoredRows, 6);
  assert.equal(fs.readFileSync(store, "utf8").trim().split("\n").length, 6);
});

test("report aggregates by feature with a hit rate over labeled traces", () => {
  const store = tmpStore();
  analyzeFile(SAMPLE, store, { k: 5 });
  const report = aggregateReport(store, { groupBy: "feature" });
  const features = report.rows.map((r) => r.key).sort();
  assert.deepEqual(features, ["billing-bot", "docs-assistant"]);
  assert.equal(report.totals.traces, 6);
  assert.ok(report.totals.failure_rate > 0);
});

test("failures can be filtered by type", () => {
  const store = tmpStore();
  analyzeFile(SAMPLE, store, { k: 5 });
  const empty = listFailures(store, { type: "empty_retrieval" });
  assert.equal(empty.count, 1);
  assert.equal(empty.failures[0].query_id, "q5");
  assert.throws(() => listFailures(store, { type: "bogus" }));
});

test("group-by failure buckets traces by failure label", () => {
  const store = tmpStore();
  analyzeFile(SAMPLE, store, { k: 5 });
  const report = aggregateReport(store, { groupBy: "failure" });
  assert.ok(report.rows.some((r) => r.key === "ungrounded"));
});
