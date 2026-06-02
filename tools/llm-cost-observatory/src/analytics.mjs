import { readJsonl } from "./fs-utils.mjs";

export function filterByWindow(events, windowArg) {
  if (!windowArg) return events;
  const ms = parseWindowToMs(windowArg);
  const maxTs = Math.max(...events.map((e) => new Date(e.timestamp).valueOf()), 0);
  const minTs = maxTs - ms;
  return events.filter((e) => new Date(e.timestamp).valueOf() >= minTs);
}

export function parseWindowToMs(windowArg) {
  const match = /^([0-9]+)([dh])$/.exec(windowArg || "");
  if (!match) throw new Error(`Invalid window '${windowArg}'. Use formats like 7d or 24h`);
  const amount = Number.parseInt(match[1], 10);
  const unit = match[2];
  return unit === "d" ? amount * 24 * 60 * 60 * 1000 : amount * 60 * 60 * 1000;
}

export function aggregateReport(storePath, options = {}) {
  const groupBy = options.groupBy || "feature";
  const events = readJsonl(storePath);
  const filtered = filterByWindow(events, options.window);

  const byKey = new Map();
  for (const ev of filtered) {
    const key = String(ev[groupBy] ?? "unknown");
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        requests: 0,
        errors: 0,
        total_tokens: 0,
        total_cost_usd: 0,
        avg_latency_ms: 0,
        retry_total: 0
      });
    }
    const row = byKey.get(key);
    row.requests += 1;
    row.errors += ev.status === "ok" ? 0 : 1;
    row.total_tokens += Number(ev.total_tokens || 0);
    row.total_cost_usd += Number(ev.cost_usd || 0);
    row.avg_latency_ms += Number(ev.latency_ms || 0);
    row.retry_total += Number(ev.retry_count || 0);
  }

  const rows = Array.from(byKey.values()).map((r) => ({
    ...r,
    avg_latency_ms: r.requests ? Math.round(r.avg_latency_ms / r.requests) : 0,
    error_rate: r.requests ? round(r.errors / r.requests) : 0,
    retry_rate: r.requests ? round(r.retry_total / r.requests) : 0,
    total_cost_usd: round(r.total_cost_usd)
  }));

  rows.sort((a, b) => b.total_cost_usd - a.total_cost_usd);

  const totals = rows.reduce(
    (acc, r) => {
      acc.requests += r.requests;
      acc.errors += r.errors;
      acc.total_tokens += r.total_tokens;
      acc.total_cost_usd += r.total_cost_usd;
      return acc;
    },
    { requests: 0, errors: 0, total_tokens: 0, total_cost_usd: 0 }
  );

  return {
    groupBy,
    window: options.window || null,
    generated_at: new Date().toISOString(),
    totals: {
      ...totals,
      total_cost_usd: round(totals.total_cost_usd),
      error_rate: totals.requests ? round(totals.errors / totals.requests) : 0
    },
    rows
  };
}

export function detectAnomalies(storePath, options = {}) {
  const events = filterByWindow(readJsonl(storePath), options.window);
  const byFeatureDay = new Map();

  for (const ev of events) {
    const day = ev.timestamp.slice(0, 10);
    const key = `${ev.feature}::${day}`;
    if (!byFeatureDay.has(key)) {
      byFeatureDay.set(key, {
        feature: ev.feature,
        day,
        cost_usd: 0,
        requests: 0,
        retries: 0,
        errors: 0
      });
    }
    const r = byFeatureDay.get(key);
    r.cost_usd += Number(ev.cost_usd || 0);
    r.requests += 1;
    r.retries += Number(ev.retry_count || 0);
    r.errors += ev.status === "ok" ? 0 : 1;
  }

  const grouped = new Map();
  for (const row of byFeatureDay.values()) {
    if (!grouped.has(row.feature)) grouped.set(row.feature, []);
    grouped.get(row.feature).push(row);
  }

  const threshold = Number(options.threshold || 2.0);
  const minDailyCost = Number(options.minDailyCost || 0);
  const anomalies = [];

  for (const [feature, days] of grouped.entries()) {
    days.sort((a, b) => a.day.localeCompare(b.day));
    if (days.length < 2) continue;

    const last = days[days.length - 1];
    const prev = days.slice(0, -1);
    const baseline = avg(prev.map((d) => d.cost_usd));
    const ratio = baseline > 0 ? last.cost_usd / baseline : 0;

    if (last.cost_usd >= minDailyCost && baseline > 0 && ratio >= threshold) {
      anomalies.push({
        type: "spend_spike",
        feature,
        day: last.day,
        value: round(last.cost_usd),
        baseline: round(baseline),
        ratio: round(ratio)
      });
    }

    const retryRate = last.requests > 0 ? last.retries / last.requests : 0;
    if (retryRate >= 0.5 && last.requests >= 3) {
      anomalies.push({
        type: "high_retry_rate",
        feature,
        day: last.day,
        value: round(retryRate),
        requests: last.requests,
        retries: last.retries
      });
    }

    const errorRate = last.requests > 0 ? last.errors / last.requests : 0;
    if (errorRate >= 0.4 && last.requests >= 3) {
      anomalies.push({
        type: "high_error_rate",
        feature,
        day: last.day,
        value: round(errorRate),
        requests: last.requests,
        errors: last.errors
      });
    }
  }

  return {
    window: options.window || null,
    generated_at: new Date().toISOString(),
    anomalies
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
          const value = row[h] ?? "";
          const s = String(value);
          return s.includes(",") ? `"${s.replaceAll('"', '""')}"` : s;
        })
        .join(",")
    );
  }
  return lines.join("\n") + "\n";
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function round(n) {
  return Math.round(n * 1000000) / 1000000;
}
