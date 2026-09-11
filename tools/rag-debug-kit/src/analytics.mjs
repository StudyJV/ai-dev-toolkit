import { readJsonl } from "./fs-utils.mjs";
import { round } from "./metrics.mjs";

const FAILURE_TYPES = ["empty_retrieval", "no_hit", "ungrounded", "low_score"];

export function aggregateReport(storePath, options = {}) {
  const groupBy = options.groupBy || "feature";
  const scored = readJsonl(storePath);

  const byKey = new Map();
  for (const s of scored) {
    const keys = groupBy === "failure"
      ? (s.failures.length ? s.failures : ["none"])
      : [String(s[groupBy] ?? "unknown")];

    for (const key of keys) {
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          traces: 0,
          labeled: 0,
          hits: 0,
          mrr_sum: 0,
          precision_sum: 0,
          recall_sum: 0,
          recall_n: 0,
          grounded: 0,
          answer_match: 0,
          answer_match_n: 0,
          latency_sum: 0,
          failures: 0
        });
      }
      const row = byKey.get(key);
      row.traces += 1;
      row.labeled += s.has_labels ? 1 : 0;
      row.hits += s.hit ? 1 : 0;
      row.mrr_sum += s.mrr;
      row.precision_sum += s.precision_at_k;
      if (s.recall_at_k !== null) {
        row.recall_sum += s.recall_at_k;
        row.recall_n += 1;
      }
      row.grounded += s.grounded ? 1 : 0;
      if (s.answer_match !== null) {
        row.answer_match += s.answer_match ? 1 : 0;
        row.answer_match_n += 1;
      }
      row.latency_sum += s.latency_ms || 0;
      row.failures += s.failures.length ? 1 : 0;
    }
  }

  const rows = Array.from(byKey.values()).map((r) => ({
    key: r.key,
    traces: r.traces,
    hit_rate: r.labeled ? round(r.hits / r.labeled) : null,
    mrr: r.traces ? round(r.mrr_sum / r.traces) : 0,
    precision_at_k: r.traces ? round(r.precision_sum / r.traces) : 0,
    recall_at_k: r.recall_n ? round(r.recall_sum / r.recall_n) : null,
    grounded_rate: r.traces ? round(r.grounded / r.traces) : 0,
    answer_match_rate: r.answer_match_n ? round(r.answer_match / r.answer_match_n) : null,
    failure_rate: r.traces ? round(r.failures / r.traces) : 0,
    avg_latency_ms: r.traces ? Math.round(r.latency_sum / r.traces) : 0
  }));

  rows.sort((a, b) => b.failure_rate - a.failure_rate || b.traces - a.traces);

  return {
    groupBy,
    generated_at: new Date().toISOString(),
    totals: buildTotals(scored),
    rows
  };
}

function buildTotals(scored) {
  const labeled = scored.filter((s) => s.has_labels);
  const withRecall = scored.filter((s) => s.recall_at_k !== null);
  const withMatch = scored.filter((s) => s.answer_match !== null);
  return {
    traces: scored.length,
    labeled: labeled.length,
    hit_rate: labeled.length ? round(labeled.filter((s) => s.hit).length / labeled.length) : null,
    mrr: scored.length ? round(sum(scored.map((s) => s.mrr)) / scored.length) : 0,
    precision_at_k: scored.length ? round(sum(scored.map((s) => s.precision_at_k)) / scored.length) : 0,
    recall_at_k: withRecall.length ? round(sum(withRecall.map((s) => s.recall_at_k)) / withRecall.length) : null,
    grounded_rate: scored.length ? round(scored.filter((s) => s.grounded).length / scored.length) : 0,
    answer_match_rate: withMatch.length ? round(withMatch.filter((s) => s.answer_match).length / withMatch.length) : null,
    failure_rate: scored.length ? round(scored.filter((s) => s.failures.length).length / scored.length) : 0
  };
}

export function listFailures(storePath, options = {}) {
  const scored = readJsonl(storePath);
  const type = options.type;
  if (type && !FAILURE_TYPES.includes(type)) {
    throw new Error(`Unknown failure type '${type}'. Use one of: ${FAILURE_TYPES.join(", ")}`);
  }

  const failures = [];
  for (const s of scored) {
    const matched = type ? s.failures.filter((f) => f === type) : s.failures;
    if (matched.length === 0) continue;
    failures.push({
      query_id: s.query_id,
      feature: s.feature,
      failures: matched.join("|"),
      top_score: s.top_score,
      grounded_ratio: s.grounded_ratio,
      rank_first_relevant: s.rank_first_relevant,
      answer_f1: s.answer_f1
    });
  }

  return {
    generated_at: new Date().toISOString(),
    type: type || "all",
    count: failures.length,
    failures
  };
}

export function toCsv(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      headers
        .map((h) => {
          const s = String(row[h] ?? "");
          return s.includes(",") ? `"${s.replaceAll('"', '""')}"` : s;
        })
        .join(",")
    );
  }
  return lines.join("\n") + "\n";
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}
