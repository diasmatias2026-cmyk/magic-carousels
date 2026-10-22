import "server-only";

import type { GeneratedCarousel } from "@/lib/types";
import { buildPrompt, parseAIResponse, type PromptInput } from "./prompt";

export type GenerateInput = PromptInput;
export type ProviderId = "gemini" | "openai" | "openrouter" | "anthropic" | "mock";

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  openrouter: "OpenRouter (Vários Modelos Grátis)",
  gemini: "Google Gemini (Grátis)",
  openai: "ChatGPT (OpenAI)",
  anthropic: "Anthropic Claude",
  mock: "Modo demonstração",
};

async function generateGemini(
  input: GenerateInput,
  customKey?: string,
  customModel?: string,
) {
  const key = customKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Chave do Google Gemini não configurada.");
  const model = customModel || process.env.GEMINI_MODEL || "gemini-1.5-flash";
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
          temperature: 0.85,
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

/** Anthropic Claude oficial */
async function generateAnthropic(
  input: GenerateInput,
  customKey?: string,
  customModel?: string,
) {
  const key = customKey || process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Chave da Anthropic Claude não configurada.");
  const model = customModel || "claude-3-5-sonnet-20241022";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(45000),
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.85,
      system: "Você responde estritamente no formato JSON válido sem texto introdutório, explicações ou markdown.",
      messages: [{ role: "user", content: buildPrompt(input) }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  const text: string =
    data.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
  return parseAIResponse(text, input.topic);
}

/** OpenAI e OpenRouter usam o formato chat completions */
async function generateChatCompletions(
  input: GenerateInput,
  provider: "openai" | "openrouter",
  customKey?: string,
  customModel?: string,
) {
  const isOR = provider === "openrouter";
  const url = isOR
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const key = isOR
    ? customKey || process.env.OPENROUTER_API_KEY
    : customKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error(`Chave do ${provider} não configurada.`);

  const model = isOR
    ? customModel || process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free"
    : customModel || process.env.OPENAI_MODEL || "gpt-4o-mini";

  const res = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(45000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(isOR
        ? {
            "HTTP-Referer":
              process.env.NEXT_PUBLIC_APP_URL || "https://magiccarousels.vercel.app",
            "X-Title": "Magic Carousels",
          }
        : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0.85,
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
  if (p === "openrouter" && process.env.OPENROUTER_API_KEY) return "openrouter";
  if (p === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  if (p === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (p === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "mock";
}

export async function generateCarouselText(
  input: GenerateInput,
  options?: {
    provider?: ProviderId;
    apiKey?: string;
    model?: string;
  },
): Promise<GeneratedCarousel & { provider: string; model?: string }> {
  const chosenProvider = options?.provider || activeProvider();
  if (chosenProvider === "mock" && !options?.apiKey) {
    throw new Error("AI_UNAVAILABLE");
  }

  if (chosenProvider === "gemini") {
    return {
      ...(await generateGemini(input, options?.apiKey, options?.model)),
      provider: "gemini",
      model: options?.model,
    };
  }

  if (chosenProvider === "anthropic") {
    return {
      ...(await generateAnthropic(input, options?.apiKey, options?.model)),
      provider: "anthropic",
      model: options?.model,
    };
  }

  if (chosenProvider === "openrouter" || chosenProvider === "openai") {
    return {
      ...(await generateChatCompletions(
        input,
        chosenProvider,
        options?.apiKey,
        options?.model,
      )),
      provider: chosenProvider,
      model: options?.model,
    };
  }

  throw new Error("Provedor de IA inválido.");
}
