export interface AIModelOption {
  id: string;
  name: string;
  badge?: string;
  description: string;
  isFree?: boolean;
}

export interface AIProviderConfig {
  id: "openrouter" | "gemini" | "openai" | "anthropic";
  name: string;
  shortLabel: string;
  badge?: string;
  keyPrefix: string;
  keyUrl: string;
  keyUrlLabel: string;
  description: string;
  defaultModel: string;
  models: AIModelOption[];
}

export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: "openrouter",
    name: "OpenRouter (Vários Modelos 100% Grátis)",
    shortLabel: "OpenRouter",
    badge: "⭐ MAIS RECOMENDADO (GRÁTIS)",
    keyPrefix: "sk-or-v1-...",
    keyUrl: "https://openrouter.ai/keys",
    keyUrlLabel: "Pegar Chave Grátis no OpenRouter (Sem Cartão)",
    description:
      "Permite usar os melhores modelos abertos do mundo de graça. Basta criar conta no OpenRouter e gerar a chave em 30 segundos sem cadastrar cartão.",
    defaultModel: "meta-llama/llama-3.3-70b-instruct:free",
    models: [
      {
        id: "meta-llama/llama-3.3-70b-instruct:free",
        name: "Llama 3.3 70B Instruct",
        badge: "👑 MELHOR MODELO GRÁTIS",
        isFree: true,
        description:
          "O modelo gratuito mais potente para copywriting em português, ganchos virais e retenção.",
      },
      {
        id: "google/gemini-2.0-flash-exp:free",
        name: "Gemini 2.0 Flash Exp",
        badge: "⚡ ULTRA RÁPIDO (GRÁTIS)",
        isFree: true,
        description:
          "Ultra veloz, gera os 7 slides em menos de 2 segundos com estrutura impecável.",
      },
      {
        id: "deepseek/deepseek-r1:free",
        name: "DeepSeek R1 (Raciocínio)",
        badge: "🧠 RACIOCÍNIO VIRAL (GRÁTIS)",
        isFree: true,
        description:
          "Modelo de raciocínio profundo, excelente para temas técnicos, educativos e explicativos.",
      },
      {
        id: "deepseek/deepseek-chat:free",
        name: "DeepSeek Chat (V3)",
        badge: "🔥 POPULAR (GRÁTIS)",
        isFree: true,
        description:
          "Texto dinâmico, copywriting fluido e adaptado para posts de alto engajamento.",
      },
      {
        id: "qwen/qwen-2.5-72b-instruct:free",
        name: "Qwen 2.5 72B Instruct",
        badge: "💡 LISTAS & DICAS (GRÁTIS)",
        isFree: true,
        description:
          "Especialista em tutoriais passo a passo, checklists e carrosséis com dados práticos.",
      },
      {
        id: "mistralai/mistral-7b-instruct:free",
        name: "Mistral 7B Instruct",
        badge: "LEVE (GRÁTIS)",
        isFree: true,
        description:
          "Respostas concisas e diretas ao ponto para formatos rápidos de carrossel.",
      },
      {
        id: "anthropic/claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet (Via OpenRouter)",
        badge: "💎 NÍVEL MÁXIMO PRO",
        isFree: false,
        description:
          "A melhor inteligência artificial do mundo para redação editorial (requer créditos OpenRouter).",
      },
      {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o Mini (Via OpenRouter)",
        badge: "ECONÔMICO PRO",
        isFree: false,
        description:
          "Precisão da OpenAI com custo em fração de centavos na sua conta OpenRouter.",
      },
    ],
  },
  {
    id: "gemini",
    name: "Google Gemini (Gratuito no AI Studio)",
    shortLabel: "Google Gemini",
    badge: "OFICIAL GOOGLE (GRÁTIS)",
    keyPrefix: "AIzaSy...",
    keyUrl: "https://aistudio.google.com/app/apikey",
    keyUrlLabel: "Criar Chave Grátis no Google AI Studio",
    description:
      "Cota gratuita de 15 requisições por minuto direto dos servidores do Google. Ótimo para quem já tem conta Google.",
    defaultModel: "gemini-1.5-flash",
    models: [
      {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        badge: "⭐ RECOMENDADO GOOGLE",
        isFree: true,
        description:
          "Modelo oficial do Google rápido e estável, com limite generoso de 15 chamadas/min grátis.",
      },
      {
        id: "gemini-2.0-flash-exp",
        name: "Gemini 2.0 Flash (Experimental)",
        badge: "NOVA GERAÇÃO",
        isFree: true,
        description:
          "A IA mais moderna do Google com velocidade de resposta instantânea.",
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        badge: "ANÁLISE AVANÇADA",
        isFree: false,
        description:
          "Maior janela de raciocínio do Google para temas altamente densos e aprofundados.",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI (ChatGPT Oficial)",
    shortLabel: "OpenAI (ChatGPT)",
    badge: "OFICIAL CHATGPT",
    keyPrefix: "sk-proj-...",
    keyUrl: "https://platform.openai.com/api-keys",
    keyUrlLabel: "Pegar Chave na OpenAI Platform",
    description:
      "Acesso direto à API do ChatGPT. Requer créditos adicionados na sua conta da OpenAI.",
    defaultModel: "gpt-4o-mini",
    models: [
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        badge: "⭐ RECOMENDADO OPENAI",
        description:
          "Modelo mais inteligente e acessível da OpenAI, excelente para posts de Instagram.",
      },
      {
        id: "gpt-4o",
        name: "GPT-4o Completo",
        badge: "POTÊNCIA MÁXIMA",
        description:
          "O modelo topo de linha da OpenAI para copywriting persuasivo e ganchos magnéticos.",
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        badge: "CLÁSSICO",
        description: "Modelo clássico leve e rápido.",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude (Oficial)",
    shortLabel: "Anthropic Claude",
    badge: "CLAUDE OFICIAL",
    keyPrefix: "sk-ant-...",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyUrlLabel: "Criar Chave no Console Anthropic",
    description:
      "Os melhores modelos do mundo para redação sofisticada, ganchos magnéticos e storytelling autêntico.",
    defaultModel: "claude-3-5-sonnet-20241022",
    models: [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        badge: "⭐ MELHOR ESCRITOR DO MUNDO",
        description:
          "O modelo mais aclamado do mercado para tom editorial humano, persuasão e storytelling.",
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        badge: "RÁPIDO & ECONÔMICO",
        description:
          "Velocidade relâmpago para gerar rascunhos de carrosséis em segundos.",
      },
    ],
  },
];

export function getProviderConfig(providerId: string): AIProviderConfig {
  return (
    AI_PROVIDERS.find((p) => p.id === providerId) || AI_PROVIDERS[0]
  );
}
