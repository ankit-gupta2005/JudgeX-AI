const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const askAI = async ({ systemPrompt, userPrompt, jsonMode = false, temperature = 0.4, model = null, maxTokens = null }) => {
  const completion = await groq.chat.completions.create({
    model: model || DEFAULT_MODEL,
    temperature,
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  return completion.choices[0]?.message?.content || "";
};

const askAIWithFallback = async ({ systemPrompt, userPrompt, jsonMode = false, temperature = 0.1, primaryModel, fallbackModel, maxTokens = null }) => {
  const attempts = [
    { model: primaryModel, label: "primary" },
    { model: primaryModel, label: "primary-retry" },
    { model: fallbackModel, label: "fallback" },
  ];

  let lastError = null;

  for (const attempt of attempts) {
    try {
      const raw = await askAI({ systemPrompt, userPrompt, jsonMode, temperature, model: attempt.model, maxTokens });
      if (jsonMode) JSON.parse(raw); // validate only when JSON mode was requested
      if (!raw || !raw.trim()) throw new Error("Empty response");
      return { raw, modelUsed: attempt.model };
    } catch (err) {
      lastError = err;
      console.warn(`askAIWithFallback: attempt [${attempt.label}] on model ${attempt.model} failed: ${err.message}`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  throw lastError;
};

module.exports = { askAI, askAIWithFallback };