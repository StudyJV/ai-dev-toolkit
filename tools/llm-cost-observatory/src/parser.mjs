const REQUIRED_FIELDS = [
  "timestamp",
  "provider",
  "model",
  "feature",
  "request_id",
  "total_tokens",
  "cost_usd",
  "status"
];

export function validateAndNormalizeEvent(raw) {
  const missing = REQUIRED_FIELDS.filter((f) => raw[f] === undefined || raw[f] === null || raw[f] === "");
  if (missing.length > 0) {
    return { ok: false, error: `Missing required fields: ${missing.join(", ")}` };
  }

  const timestamp = new Date(raw.timestamp);
  if (Number.isNaN(timestamp.valueOf())) {
    return { ok: false, error: "Invalid timestamp" };
  }

  const event = {
    timestamp: timestamp.toISOString(),
    provider: String(raw.provider),
    model: String(raw.model),
    feature: String(raw.feature),
    endpoint: raw.endpoint ? String(raw.endpoint) : "/api/llm",
    request_id: String(raw.request_id),
    prompt_tokens: toInt(raw.prompt_tokens, 0),
    completion_tokens: toInt(raw.completion_tokens, 0),
    total_tokens: toInt(raw.total_tokens, 0),
    cost_usd: toNum(raw.cost_usd, 0),
    status: String(raw.status),
    latency_ms: toInt(raw.latency_ms, 0),
    retry_count: toInt(raw.retry_count, 0),
    user_id: raw.user_id ? String(raw.user_id) : undefined,
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : undefined
  };

  if (event.total_tokens < 0 || event.cost_usd < 0) {
    return { ok: false, error: "Negative totals are not allowed" };
  }

  return { ok: true, event };
}

function toInt(v, fallback) {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toNum(v, fallback) {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }

  out.push(cur);
  return out.map((x) => x.trim());
}
