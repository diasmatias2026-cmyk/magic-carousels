import "server-only";

import type { GeneratedCarousel } from "@/lib/types";
import { buildPrompt, parseAIResponse, type PromptInput } from "./prompt";

export type GenerateInput = PromptInput;
export type ProviderId = "gemini" | "openai" | "openrouter" | "mock";

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  gemini: "Google Gemini",
  openai: "ChatGPT (OpenAI)",
  openrouter: "OpenRouter (modelos grátis)",
  mock: "Modo demonstração",
};

async function generateGemini(input: GenerateInput) {
  const key = process.env.GEMINI_API_KEY!;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      signal: AbortSignal.timeout(45000),
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.9,
        },
      }),
    },
  );
  if (!res.ok)
    throw new Error(
      `Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`,
    );
  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? "";
  return parseAIResponse(text, input.topic);
}

/** OpenAI e OpenRouter usam o mesmo formato (chat completions). */
async function generateChatCompletions(
  input: GenerateInput,
  provider: "openai" | "openrouter",
) {
  const isOR = provider === "openrouter";
  const url = isOR
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const key = isOR
    ? process.env.OPENROUTER_API_KEY
    : process.env.OPENAI_API_KEY;
  const model = isOR
    ? process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free"
    : process.env.OPENAI_MODEL || "gpt-4o-mini";

  const res = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(45000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(isOR
        ? {
            "HTTP-Referer":
              process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
            "X-Title": "Magic Carousels",
          }
        : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      ...(isOR ? {} : { response_format: { type: "json_object" } }),
      messages: [
        {
          role: "system",
          content: "Você responde somente com JSON válido, sem texto extra.",
        },
        { role: "user", content: buildPrompt(input) },
      ],
    }),
  });
  if (!res.ok)
    throw new Error(
      `${provider} ${res.status}: ${(await res.text()).slice(0, 200)}`,
    );
  const data = await res.json();
  return parseAIResponse(
    data.choices?.[0]?.message?.content ?? "",
    input.topic,
  );
}

/** Provedor ativo conforme .env (cai para "mock" se faltar chave). */
export function activeProvider(): ProviderId {
  const p = (process.env.AI_PROVIDER || "mock").toLowerCase();
  if (p === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  if (p === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (p === "openrouter" && process.env.OPENROUTER_API_KEY) return "openrouter";
  return "mock";
}

export async function generateCarouselText(
  input: GenerateInput,
): Promise<GeneratedCarousel & { provider: string }> {
  const provider = activeProvider();
  if (provider === "mock") throw new Error("AI_UNAVAILABLE");
  if (provider === "gemini")
    return { ...(await generateGemini(input)), provider };
  return { ...(await generateChatCompletions(input, provider)), provider };
}
