import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv, validateAndNormalizeEvent } from "../src/parser.mjs";

test("parseCsv handles quoted commas", () => {
  const csv = "feature,model,cost_usd\n\"support,chat\",gpt-4.1-mini,0.01\n";
  const rows = parseCsv(csv);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].feature, "support,chat");
});

test("validateAndNormalizeEvent validates required fields", () => {
  const bad = validateAndNormalizeEvent({ model: "x" });
  assert.equal(bad.ok, false);

  const good = validateAndNormalizeEvent({
    timestamp: "2026-05-20T10:02:00Z",
    provider: "openai",
    model: "gpt-4.1-mini",
    feature: "support_chat",
    request_id: "r1",
    total_tokens: 100,
    cost_usd: 0.001,
    status: "ok"
  });

  assert.equal(good.ok, true);
  assert.equal(good.event.total_tokens, 100);
});
