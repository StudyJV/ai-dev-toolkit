import OpenAI from "openai";
import { withCostTracking } from "./with-cost-tracking.mjs";

// Single-line wrap of existing OpenAI client.
const openai = withCostTracking(new OpenAI({ apiKey: process.env.OPENAI_API_KEY }), {
  feature: "document_processing",
  endpoint: "/api/summarize",
  userId: "hash_default_user"
});

async function main() {
  const response = await openai.responses.create(
    {
      model: "gpt-5-mini",
      input: "Summarize why cost observability matters for LLM apps."
    },
    {
      attribution: {
        userId: "hash_user_123",
        feature: "summarization",
        endpoint: "/api/document-summary",
        tags: ["document-processing", "summarization"],
        metadata: {
          documentId: "doc-123",
          workflow: "post-upload"
        }
      }
    }
  );

  console.log(response.output_text || "No response text");
  console.log("Logged usage event to tools/llm-cost-observatory/examples/usage-events.jsonl");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
