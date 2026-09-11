import test from "node:test";
import assert from "node:assert/strict";
import { scoreTrace, tokenize } from "../src/metrics.mjs";
import { validateAndNormalizeTrace } from "../src/parser.mjs";

function norm(raw) {
  const r = validateAndNormalizeTrace(raw);
  assert.equal(r.ok, true, r.error);
  return r.trace;
}

test("hit and mrr use rank of first relevant chunk", () => {
  const s = scoreTrace(
    norm({
      timestamp: "2026-09-01T00:00:00Z",
      query_id: "q",
      query: "x",
      retrieved: [
        { chunk_id: "a", text: "irrelevant filler", score: 0.5 },
        { chunk_id: "b", text: "the answer body", score: 0.4 }
      ],
      answer: "the answer body",
      expected_chunk_ids: ["b"]
    })
  );
  assert.equal(s.hit, true);
  assert.equal(s.rank_first_relevant, 2);
  assert.equal(s.mrr, 0.5);
  assert.equal(s.recall_at_k, 1);
});

test("no relevant chunk flags no_hit", () => {
  const s = scoreTrace(
    norm({
      timestamp: "2026-09-01T00:00:00Z",
      query_id: "q",
      query: "x",
      retrieved: [{ chunk_id: "a", text: "unrelated", score: 0.6 }],
      answer: "unrelated text",
      expected_chunk_ids: ["z"]
    })
  );
  assert.equal(s.hit, false);
  assert.ok(s.failures.includes("no_hit"));
});

test("answer not supported by context flags ungrounded", () => {
  const s = scoreTrace(
    norm({
      timestamp: "2026-09-01T00:00:00Z",
      query_id: "q",
      query: "x",
      retrieved: [{ chunk_id: "a", text: "cats sleep sixteen hours daily", score: 0.9 }],
      answer: "quarterly revenue grew twelve percent in europe"
    })
  );
  assert.equal(s.grounded, false);
  assert.ok(s.failures.includes("ungrounded"));
});

test("low top score is flagged", () => {
  const s = scoreTrace(
    norm({
      timestamp: "2026-09-01T00:00:00Z",
      query_id: "q",
      query: "x",
      retrieved: [{ chunk_id: "a", text: "partial match content here", score: 0.19 }],
      answer: "partial match content here"
    }),
    { lowScoreThreshold: 0.3 }
  );
  assert.ok(s.failures.includes("low_score"));
});

test("empty retrieval is flagged and unlabeled metrics are null", () => {
  const s = scoreTrace(
    norm({
      timestamp: "2026-09-01T00:00:00Z",
      query_id: "q",
      query: "x",
      retrieved: [],
      answer: "no idea"
    })
  );
  assert.ok(s.failures.includes("empty_retrieval"));
  assert.equal(s.has_labels, false);
  assert.equal(s.recall_at_k, null);
});

test("tokenize drops stopwords and punctuation", () => {
  assert.deepEqual(tokenize("The API key, and the token!"), ["api", "key", "token"]);
});
