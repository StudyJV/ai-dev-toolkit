const REQUIRED_FIELDS = ["timestamp", "query_id", "query", "retrieved", "answer"];

export function validateAndNormalizeTrace(raw) {
  const missing = REQUIRED_FIELDS.filter((f) => raw[f] === undefined || raw[f] === null || raw[f] === "");
  if (missing.length > 0) {
    return { ok: false, error: `Missing required fields: ${missing.join(", ")}` };
  }

  const timestamp = new Date(raw.timestamp);
  if (Number.isNaN(timestamp.valueOf())) {
    return { ok: false, error: "Invalid timestamp" };
  }

  if (!Array.isArray(raw.retrieved)) {
    return { ok: false, error: "retrieved must be an array" };
  }

  const retrieved = raw.retrieved.map((c, i) => {
    if (!c || c.chunk_id === undefined || c.text === undefined) {
      throw new Error(`retrieved[${i}] needs chunk_id and text`);
    }
    return {
      chunk_id: String(c.chunk_id),
      text: String(c.text),
      score: c.score === undefined || c.score === null ? null : toNum(c.score, 0),
      is_relevant: typeof c.is_relevant === "boolean" ? c.is_relevant : undefined
    };
  });

  const trace = {
    timestamp: timestamp.toISOString(),
    query_id: String(raw.query_id),
    query: String(raw.query),
    feature: raw.feature ? String(raw.feature) : "unattributed",
    retrieved,
    answer: String(raw.answer),
    expected_answer: raw.expected_answer ? String(raw.expected_answer) : undefined,
    expected_chunk_ids: Array.isArray(raw.expected_chunk_ids)
      ? raw.expected_chunk_ids.map(String)
      : undefined,
    latency_ms: toInt(raw.latency_ms, 0),
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : undefined
  };

  return { ok: true, trace };
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
