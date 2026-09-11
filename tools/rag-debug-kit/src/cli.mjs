#!/usr/bin/env node
import { resolveStorePath } from "./fs-utils.mjs";
import { analyzeFile } from "./analyze.mjs";
import { aggregateReport, listFailures } from "./analytics.mjs";
import { exportOutput, printFailures, printReport } from "./output.mjs";

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const options = {};
  const positional = [];

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = rest[i + 1];
      if (!next || next.startsWith("--")) {
        options[key] = true;
      } else {
        options[key] = next;
        i += 1;
      }
    } else {
      positional.push(token);
    }
  }

  return { cmd, options, positional };
}

function usage() {
  console.log(`rag-debug-kit

Usage:
  node src/cli.mjs analyze <path> [--store <path>] [--k 5] [--grounded-threshold 0.2] [--low-score-threshold 0.3] [--strict]
  node src/cli.mjs report [--group-by feature|failure] [--format table|json|csv] [--output <path>] [--store <path>]
  node src/cli.mjs failures [--type empty_retrieval|no_hit|ungrounded|low_score] [--format table|json|csv] [--output <path>] [--store <path>]
  node src/cli.mjs export --type report|failures [--format json|csv] [--output <path>] [report/failure options]
`);
}

function scoreOptions(options) {
  return {
    k: options.k,
    groundedThreshold: options["grounded-threshold"],
    lowScoreThreshold: options["low-score-threshold"],
    answerMatchThreshold: options["answer-match-threshold"],
    strict: Boolean(options.strict)
  };
}

async function main() {
  const { cmd, options, positional } = parseArgs(process.argv.slice(2));
  if (!cmd || cmd === "help" || cmd === "--help") {
    usage();
    return;
  }

  const storePath = resolveStorePath(options.store);

  if (cmd === "analyze") {
    const inputPath = positional[0];
    if (!inputPath) throw new Error("Missing input path for analyze");
    const result = analyzeFile(inputPath, storePath, scoreOptions(options));
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (cmd === "report") {
    const report = aggregateReport(storePath, { groupBy: options["group-by"] });
    if (options.format && options.format !== "table") {
      const text = exportOutput(report, options.format, options.output);
      if (!options.output) console.log(text);
      return;
    }
    printReport(report);
    if (options.output) exportOutput(report, "json", options.output);
    return;
  }

  if (cmd === "failures") {
    const result = listFailures(storePath, { type: options.type });
    if (options.format && options.format !== "table") {
      const text = exportOutput(result, options.format, options.output);
      if (!options.output) console.log(text);
      return;
    }
    printFailures(result);
    if (options.output) exportOutput(result, "json", options.output);
    return;
  }

  if (cmd === "export") {
    const type = options.type || "report";
    const format = options.format || "json";

    if (type === "report") {
      const report = aggregateReport(storePath, { groupBy: options["group-by"] });
      const text = exportOutput(report, format, options.output);
      if (!options.output) console.log(text);
      return;
    }

    if (type === "failures") {
      const result = listFailures(storePath, { type: options["failure-type"] });
      const text = exportOutput(result, format, options.output);
      if (!options.output) console.log(text);
      return;
    }

    throw new Error(`Unsupported export type: ${type}`);
  }

  throw new Error(`Unknown command: ${cmd}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
