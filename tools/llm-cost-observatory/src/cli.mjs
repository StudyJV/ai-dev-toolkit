#!/usr/bin/env node
import { resolveStorePath } from "./fs-utils.mjs";
import { ingestFile } from "./ingest.mjs";
import { aggregateReport, detectAnomalies } from "./analytics.mjs";
import { exportOutput, printAnomalies, printReport } from "./output.mjs";

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
  console.log(`llm-cost-observatory

Usage:
  node src/cli.mjs ingest <path> [--store <path>] [--strict]
  node src/cli.mjs report [--group-by feature|model|provider|endpoint|status] [--window 7d] [--format table|json|csv] [--output <path>] [--store <path>]
  node src/cli.mjs anomalies [--window 7d] [--threshold 2] [--min-daily-cost 0] [--format table|json|csv] [--output <path>] [--store <path>]
  node src/cli.mjs export --type report|anomalies [--format json|csv] [--output <path>] [report/anomaly options]
`);
}

async function main() {
  const { cmd, options, positional } = parseArgs(process.argv.slice(2));
  if (!cmd || cmd === "help" || cmd === "--help") {
    usage();
    return;
  }

  const storePath = resolveStorePath(options.store);

  if (cmd === "ingest") {
    const inputPath = positional[0];
    if (!inputPath) throw new Error("Missing input path for ingest");
    const result = ingestFile(inputPath, storePath, Boolean(options.strict));
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (cmd === "report") {
    const report = aggregateReport(storePath, {
      groupBy: options["group-by"],
      window: options.window
    });

    if (options.format && options.format !== "table") {
      const text = exportOutput(report, options.format, options.output);
      if (!options.output) console.log(text);
      return;
    }

    printReport(report);
    if (options.output) {
      exportOutput(report, "json", options.output);
    }
    return;
  }

  if (cmd === "anomalies") {
    const result = detectAnomalies(storePath, {
      window: options.window,
      threshold: options.threshold,
      minDailyCost: options["min-daily-cost"]
    });

    if (options.format && options.format !== "table") {
      const text = exportOutput(result, options.format, options.output);
      if (!options.output) console.log(text);
      return;
    }

    printAnomalies(result);
    if (options.output) {
      exportOutput(result, "json", options.output);
    }
    return;
  }

  if (cmd === "export") {
    const type = options.type || "report";
    const format = options.format || "json";

    if (type === "report") {
      const report = aggregateReport(storePath, {
        groupBy: options["group-by"],
        window: options.window
      });
      const text = exportOutput(report, format, options.output);
      if (!options.output) console.log(text);
      return;
    }

    if (type === "anomalies") {
      const result = detectAnomalies(storePath, {
        window: options.window,
        threshold: options.threshold,
        minDailyCost: options["min-daily-cost"]
      });
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
