import fs from "node:fs";
import path from "node:path";

function appendJsonl(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(obj) + "\n", "utf8");
}

function estimateCostUsd(model, promptTokens, completionTokens) {
  const pricing = {
    "gpt-4.1-mini": { inPerM: 0.4, outPerM: 1.6 },
    "gpt-4.1": { inPerM: 2.0, outPerM: 8.0 },
    "gpt-5-mini": { inPerM: 0.25, outPerM: 2.0 }
  };

  const p = pricing[model];
  if (!p) return 0;

  const inputCost = (promptTokens / 1_000_000) * p.inPerM;
  const outputCost = (completionTokens / 1_000_000) * p.outPerM;
  return Number((inputCost + outputCost).toFixed(8));
}

function buildEvent({
  defaults,
  attribution,
  requestId,
  model,
  started,
  usage,
  status,
  error
}) {
  const promptTokens = usage?.prompt_tokens || usage?.input_tokens || 0;
  const completionTokens = usage?.completion_tokens || usage?.output_tokens || 0;
  const totalTokens = usage?.total_tokens || promptTokens + completionTokens;

  const base = {
    timestamp: new Date().toISOString(),
    provider: "openai",
    model: model || defaults.model || "unknown",
    feature: attribution?.feature || defaults.feature || "unattributed",
    endpoint: attribution?.endpoint || defaults.endpoint || "/api/llm",
    request_id: requestId,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
    cost_usd: estimateCostUsd(model || defaults.model, promptTokens, completionTokens),
    status,
    latency_ms: Date.now() - started,
    retry_count: attribution?.retry_count || 0,
    user_id: attribution?.userId || defaults.userId || undefined
  };

  if (!error && attribution?.tags) {
    base.metadata = { tags: attribution.tags, ...(attribution.metadata || {}) };
  }

  if (error) {
    base.metadata = {
      ...(attribution?.metadata || {}),
      tags: attribution?.tags || [],
      error_name: error?.name || "Error",
      error_message: error?.message || "Unknown error"
    };
  }

  return base;
}

export function withCostTracking(openaiClient, options = {}) {
  const {
    feature,
    endpoint,
    userId,
    model,
    logPath = path.resolve(process.cwd(), "tools/llm-cost-observatory/examples/usage-events.jsonl")
  } = options;

  const defaults = { feature, endpoint, userId, model };

  return {
    ...openaiClient,
    responses: {
      ...openaiClient.responses,
      create: async (params, tracking = {}) => {
        const started = Date.now();
        const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        try {
          const response = await openaiClient.responses.create(params);
          const event = buildEvent({
            defaults,
            attribution: tracking.attribution,
            requestId,
            model: params?.model,
            started,
            usage: response?.usage,
            status: "ok"
          });

          appendJsonl(logPath, event);
          return response;
        } catch (error) {
          const event = buildEvent({
            defaults,
            attribution: tracking.attribution,
            requestId,
            model: params?.model,
            started,
            usage: null,
            status: "error",
            error
          });

          appendJsonl(logPath, event);
          throw error;
        }
      }
    },
    chat: {
      ...openaiClient.chat,
      completions: {
        ...openaiClient.chat?.completions,
        create: async (params, tracking = {}) => {
          const started = Date.now();
          const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

          try {
            const response = await openaiClient.chat.completions.create(params);
            const event = buildEvent({
              defaults,
              attribution: tracking.attribution,
              requestId,
              model: params?.model,
              started,
              usage: response?.usage,
              status: "ok"
            });

            appendJsonl(logPath, event);
            return response;
          } catch (error) {
            const event = buildEvent({
              defaults,
              attribution: tracking.attribution,
              requestId,
              model: params?.model,
              started,
              usage: null,
              status: "error",
              error
            });

            appendJsonl(logPath, event);
            throw error;
          }
        }
      }
    }
  };
}
