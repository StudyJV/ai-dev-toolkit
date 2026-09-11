#!/usr/bin/env node
// Combine a llm-cost-observatory report and a rag-debug-kit report into one
// review bundle (JSON + Markdown). No dependencies.
//
// Usage:
//   node examples/dashboards/build-bundle.mjs \
//     --cost tools/llm-cost-observatory/examples/report.json \
//     --rag tools/rag-debug-kit/examples/report.json \
//     --out examples/dashboards/bundle

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      options[key] = true;
    } else {
      options[key] = next;
      i += 1;
    }
  }
  return options;
}

function readJson(file) {
  if (!file || !fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function costSection(cost) {
  if (!cost) return "_No cost report supplied._\n";
  const t = cost.totals || {};
  const top = (cost.rows || [])
    .slice(0, 5)
    .map((r) => `| ${r.key} | ${r.requests} | ${r.total_cost_usd} | ${r.error_rate} |`)
    .join("\n");
  return [
    `Grouped by \`${cost.groupBy}\` - ${t.requests ?? 0} requests, $${t.total_cost_usd ?? 0}, error rate ${t.error_rate ?? 0}.`,
    "",
    "| key | requests | cost_usd | error_rate |",
    "| --- | --- | --- | --- |",
    top || "| _(no rows)_ | | | |"
  ].join("\n");
}

function ragSection(rag) {
  if (!rag) return "_No RAG report supplied._\n";
  const t = rag.totals || {};
  const top = (rag.rows || [])
    .slice(0, 5)
    .map((r) => `| ${r.key} | ${r.traces} | ${r.hit_rate ?? "n/a"} | ${r.grounded_rate} | ${r.failure_rate} |`)
    .join("\n");
  return [
    `Grouped by \`${rag.groupBy}\` - ${t.traces ?? 0} traces, hit rate ${t.hit_rate ?? "n/a"}, grounded ${t.grounded_rate ?? 0}, failure rate ${t.failure_rate ?? 0}.`,
    "",
    "| key | traces | hit_rate | grounded_rate | failure_rate |",
    "| --- | --- | --- | --- | --- |",
    top || "| _(no rows)_ | | | | |"
  ].join("\n");
}

const options = parseArgs(process.argv.slice(2));
const cost = readJson(options.cost);
const rag = readJson(options.rag);
const outBase = options.out || "examples/dashboards/bundle";

const generatedAt = new Date().toISOString();
const bundle = {
  generated_at: generatedAt,
  sources: { cost: options.cost || null, rag: options.rag || null },
  cost,
  rag
};

const md = `# AI Dev Toolkit - Review Bundle

Generated: ${generatedAt}

## LLM cost

${costSection(cost)}

## RAG quality

${ragSection(rag)}

## Suggested review questions
- Which feature drives the most spend, and is its RAG quality holding up?
- Any feature with a rising failure rate that also grew in cost?
- Do ungrounded answers correlate with retry-heavy or error-heavy paths?
`;

fs.mkdirSync(path.dirname(path.resolve(outBase)), { recursive: true });
fs.writeFileSync(`${outBase}.json`, JSON.stringify(bundle, null, 2) + "\n", "utf8");
fs.writeFileSync(`${outBase}.md`, md, "utf8");
console.log(`Wrote ${outBase}.json and ${outBase}.md`);
