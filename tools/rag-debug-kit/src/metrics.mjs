const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "is", "are", "was", "were", "be", "been", "as", "at", "by", "it", "this",
  "that", "these", "those", "from", "into", "than", "then", "so", "if", "not"
]);

export function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function overlapRatio(aTokens, bSet) {
  const uniq = new Set(aTokens);
  if (uniq.size === 0) return 0;
  let hits = 0;
  for (const t of uniq) if (bSet.has(t)) hits += 1;
  return hits / uniq.size;
}

function f1(aTokens, bTokens) {
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  if (aSet.size === 0 || bSet.size === 0) return 0;
  let shared = 0;
  for (const t of aSet) if (bSet.has(t)) shared += 1;
  if (shared === 0) return 0;
  const precision = shared / aSet.size;
  const recall = shared / bSet.size;
  return (2 * precision * recall) / (precision + recall);
}

export function scoreTrace(trace, options = {}) {
  const k = Number(options.k || 5);
  const groundedThreshold = Number(options.groundedThreshold ?? 0.2);
  const lowScoreThreshold = Number(options.lowScoreThreshold ?? 0.3);
  const answerMatchThreshold = Number(options.answerMatchThreshold ?? 0.5);

  const topK = trace.retrieved.slice(0, k);
  const expected = new Set(trace.expected_chunk_ids || []);
  const hasLabels =
    expected.size > 0 || trace.retrieved.some((c) => typeof c.is_relevant === "boolean");

  const relevantFlags = topK.map(
    (c) => c.is_relevant === true || expected.has(c.chunk_id)
  );
  const relevantCount = relevantFlags.filter(Boolean).length;
  const rankFirstRelevant = relevantFlags.indexOf(true) + 1 || null;

  const scores = topK
    .map((c) => c.score)
    .filter((s) => typeof s === "number");
  const topScore = scores.length ? Math.max(...scores) : null;
  const sortedScores = [...scores].sort((a, b) => b - a);
  const scoreGap =
    sortedScores.length >= 2 ? round(sortedScores[0] - sortedScores[1]) : null;

  const contextTokens = new Set(topK.flatMap((c) => tokenize(c.text)));
  const answerTokens = tokenize(trace.answer);
  const groundedRatio = round(overlapRatio(answerTokens, contextTokens));
  const grounded = answerTokens.length === 0 ? true : groundedRatio >= groundedThreshold;

  let answerMatch = null;
  let answerF1 = null;
  if (trace.expected_answer) {
    answerF1 = round(f1(answerTokens, tokenize(trace.expected_answer)));
    answerMatch = answerF1 >= answerMatchThreshold;
  }

  const recallAtK =
    expected.size > 0 ? round(relevantCount / expected.size) : null;
  const precisionAtK = topK.length ? round(relevantCount / topK.length) : 0;

  const failures = [];
  if (topK.length === 0) failures.push("empty_retrieval");
  if (hasLabels && rankFirstRelevant === null) failures.push("no_hit");
  if (trace.answer.trim() && !grounded) failures.push("ungrounded");
  if (topScore !== null && topScore < lowScoreThreshold) failures.push("low_score");

  return {
    timestamp: trace.timestamp,
    query_id: trace.query_id,
    feature: trace.feature,
    k: topK.length,
    has_labels: hasLabels,
    hit: rankFirstRelevant !== null,
    rank_first_relevant: rankFirstRelevant,
    mrr: rankFirstRelevant ? round(1 / rankFirstRelevant) : 0,
    precision_at_k: precisionAtK,
    recall_at_k: recallAtK,
    top_score: topScore,
    score_gap: scoreGap,
    grounded_ratio: groundedRatio,
    grounded,
    answer_f1: answerF1,
    answer_match: answerMatch,
    latency_ms: trace.latency_ms || 0,
    failures
  };
}

export function round(n) {
  return Math.round(n * 1e6) / 1e6;
}
