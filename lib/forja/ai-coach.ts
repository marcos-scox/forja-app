import { readAiApiKey } from "@/lib/forja/ai-storage";
import type { AIProvider, AiChatMessage, CardioSession, ForjaPreferences } from "@/lib/forja/types";

export const AI_PROVIDER_LABEL: Record<AIProvider, string> = {
  manus: "Manus",
  openai: "GPT / OpenAI",
  groq: "Groq",
  gemini: "Gemini",
  claude: "Claude",
};

export const DEFAULT_AI_MODEL: Record<AIProvider, string> = {
  manus: "manus-1.6-lite",
  openai: "gpt-4.1-mini",
  groq: "openai/gpt-oss-120b",
  gemini: "gemini-2.5-flash",
  claude: "claude-sonnet-4-6",
};

/** Modelos Groq atualmente adequados para conversa de texto no Forja. */
export const GROQ_CHAT_MODELS = [
  { id: "openai/gpt-oss-120b", label: "GPT OSS 120B" },
  { id: "openai/gpt-oss-20b", label: "GPT OSS 20B" },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
  { id: "groq/compound", label: "Groq Compound" },
  { id: "groq/compound-mini", label: "Groq Compound Mini" },
  { id: "qwen/qwen3.8-27b", label: "Qwen 3.8 27B" },
  { id: "qwen/qwen3.6-27b", label: "Qwen 3.6 27B" },
  { id: "minimaxai/minimax-m2.7", label: "MiniMax M2.7" },
] as const;

const COACH_INSTRUCTION = `Você é o Forja Coach, um assistente brasileiro especializado em corrida, caminhada e exercícios físicos gerais. Responda em português claro, acolhedor e objetivo. Dê sugestões progressivas, adaptáveis ao nível de experiência e com foco em técnica, consistência, descanso e segurança. Não diagnostique doenças, não substitua profissionais de saúde e não prescreva medicamentos. Diante de dor no peito, desmaio, falta de ar intensa, dor aguda, lesão persistente ou qualquer sinal preocupante, recomende interromper a atividade e buscar atendimento profissional. Faça perguntas breves quando dados essenciais estiverem faltando.`;

type ChatRequest = {
  preferences: ForjaPreferences;
  messages: AiChatMessage[];
  sessions: CardioSession[];
};

type ProviderMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function buildContext(sessions: CardioSession[]): string {
  if (!sessions.length) return "O usuário ainda não possui sessões de cardio registradas no Forja.";
  const last = sessions[0];
  const totalDistance = sessions.reduce((sum, session) => sum + session.distanceM, 0) / 1_000;
  return `Dados locais do usuário: ${sessions.length} sessão(ões), ${totalDistance.toFixed(2)} km acumulados. Última atividade: ${last.mode}, ${(last.distanceM / 1_000).toFixed(2)} km em ${Math.round(last.durationMs / 60_000)} min.`;
}

function limitedMessages(messages: ProviderMessage[]) {
  return messages
    .filter((message) => message.role === "system" || message.role === "user" || message.role === "assistant")
    .slice(-12)
    .map((message) => ({ role: message.role, content: message.content }));
}

function systemInstruction(messages: ProviderMessage[]) {
  return messages.find((message) => message.role === "system")?.content ?? COACH_INSTRUCTION;
}

function readableError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const source = payload as { error?: { message?: string }; message?: string };
    return source.error?.message ?? source.message ?? fallback;
  }
  return fallback;
}

async function parseResponse(response: Response, fallback: string): Promise<any> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = readableError(payload, `${fallback} (HTTP ${response.status})`);
    throw new Error(`${detail} (HTTP ${response.status})`);
  }
  return payload;
}

async function requestOpenAiCompatible(baseUrl: string, apiKey: string, model: string, messages: ProviderMessage[]) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: COACH_INSTRUCTION }, ...limitedMessages(messages)],
      temperature: 0.45,
      ...(baseUrl.includes("api.groq.com") ? { max_tokens: 650 } : { max_completion_tokens: 650 }),
      stream: false,
    }),
  });
  const payload = await parseResponse(response, "Não foi possível obter a resposta do provedor de IA.");
  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("O provedor não retornou uma resposta de texto.");
  return text.trim();
}

async function requestGemini(apiKey: string, model: string, messages: ProviderMessage[]) {
  const contents = limitedMessages(messages).filter((message) => message.role !== "system").map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction(messages) }] },
      contents,
      generationConfig: { temperature: 0.45, maxOutputTokens: 650 },
    }),
  });
  const payload = await parseResponse(response, "Não foi possível obter a resposta do Gemini.");
  const text = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("").trim();
  if (!text) throw new Error("O Gemini não retornou uma resposta de texto.");
  return text;
}

async function requestClaude(apiKey: string, model: string, messages: ProviderMessage[]) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 650,
      system: systemInstruction(messages),
      messages: limitedMessages(messages).filter((message) => message.role !== "system"),
    }),
  });
  const payload = await parseResponse(response, "Não foi possível obter a resposta do Claude.");
  const text = payload?.content?.filter((part: { type?: string }) => part.type === "text").map((part: { text?: string }) => part.text ?? "").join("\n").trim();
  if (!text) throw new Error("O Claude não retornou uma resposta de texto.");
  return text;
}

function extractText(value: unknown): string[] {
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (Array.isArray(value)) return value.flatMap(extractText);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const ownText = typeof record.text === "string" ? [record.text.trim()] : [];
  return [...ownText, ...Object.entries(record).flatMap(([key, entry]) => (key === "text" ? [] : extractText(entry)))];
}

function eventRole(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const event = value as Record<string, unknown>;
  if (typeof event.role === "string") return event.role.toLowerCase();
  const message = event.message;
  if (message && typeof message === "object" && typeof (message as Record<string, unknown>).role === "string") {
    return String((message as Record<string, unknown>).role).toLowerCase();
  }
  return "";
}

async function requestManus(apiKey: string, profile: string, messages: ProviderMessage[], context: string) {
  const latestQuestion = messages.filter((message) => message.role === "user").at(-1)?.content;
  if (!latestQuestion) throw new Error("Escreva uma pergunta para conversar com o coach.");
  const createResponse = await fetch("https://api.manus.ai/v2/task.create", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-manus-api-key": apiKey },
    body: JSON.stringify({
      title: "Forja IA Coach",
      locale: "pt-BR",
      interactive_mode: false,
      hide_in_task_list: true,
      agent_profile: profile,
      message: { role: "user", content: `${COACH_INSTRUCTION}\n\n${context}\n\nPergunta do usuário: ${latestQuestion}\n\nResponda somente à pergunta, sem executar ações externas.` },
    }),
  });
  const created = await parseResponse(createResponse, "Não foi possível iniciar a resposta do Manus.");
  const taskId = created?.task_id;
  if (!taskId) throw new Error("O Manus não retornou o identificador da conversa.");

  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    const statusResponse = await fetch(`https://api.manus.ai/v2/task.listMessages?task_id=${encodeURIComponent(taskId)}&order=desc&limit=50`, {
      headers: { "x-manus-api-key": apiKey },
    });
    const status = await parseResponse(statusResponse, "Não foi possível acompanhar a resposta do Manus.");
    const events = Array.isArray(status?.data) ? status.data : [];
    const candidate = events
      .filter((event: unknown) => eventRole(event) === "assistant")
      .flatMap(extractText)
      .find((text: string) => text !== latestQuestion && text.length > 12);
    if (candidate) return candidate;
  }
  throw new Error("O Manus demorou mais que o esperado. Tente novamente em instantes.");
}

export async function testAiProvider({ provider, apiKey, model }: { provider: AIProvider; apiKey?: string; model: string }): Promise<void> {
  const key = apiKey?.trim() || await readAiApiKey(provider);
  if (!key) throw new Error(`Nenhuma chave de API de ${AI_PROVIDER_LABEL[provider]} foi encontrada.`);
  if (provider !== "groq") throw new Error("O teste rápido está disponível para a Groq nesta versão.");
  await requestOpenAiCompatible("https://api.groq.com/openai/v1", key, model, [{ role: "user", content: "Responda apenas: OK" }]);
}

export async function askCoach({ preferences, messages, sessions }: ChatRequest): Promise<string> {
  const provider = preferences.aiProvider;
  const apiKey = await readAiApiKey(provider);
  if (!apiKey) throw new Error(`Adicione a chave de API de ${AI_PROVIDER_LABEL[provider]} nos Ajustes para conversar com o coach.`);

  const model = preferences.aiModel.trim() || DEFAULT_AI_MODEL[provider];
  const context = buildContext(sessions);
  const conversation = [{ role: "system" as const, content: context }, ...messages];

  if (provider === "openai") return requestOpenAiCompatible("https://api.openai.com/v1", apiKey, model, conversation);
  if (provider === "groq") return requestOpenAiCompatible("https://api.groq.com/openai/v1", apiKey, model, conversation);
  if (provider === "gemini") return requestGemini(apiKey, model, conversation);
  if (provider === "claude") return requestClaude(apiKey, model, conversation);
  return requestManus(apiKey, model, conversation, context);
}
