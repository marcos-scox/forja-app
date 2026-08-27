export type CardioMode = "corrida" | "caminhada" | "ciclismo";

export type RoutePoint = {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number | null;
};

export type StepSource = "sensor" | "estimativa";

export type AIProvider = "manus" | "openai" | "groq" | "gemini" | "claude";

export type AiChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type CardioSession = {
  id: string;
  mode: CardioMode;
  createdAt: string;
  startedAt: number;
  durationMs: number;
  distanceM: number;
  averagePaceSecPerKm: number | null;
  steps: number;
  stepSource: StepSource;
  route: RoutePoint[];
};

export type LiveCardioSession = {
  id: string;
  mode: CardioMode;
  status: "running" | "paused";
  startedAt: number;
  resumedAt: number;
  elapsedBeforePauseMs: number;
  distanceM: number;
  steps: number;
  stepSource: StepSource;
  route: RoutePoint[];
  currentLocation: RoutePoint | null;
  locationAccuracy: number | null;
};

export type Workout = {
  id: string;
  title: string;
  weekday: number;
  exercises: string[];
  completed: boolean;
};

export type ForjaPreferences = {
  usePedometer: boolean;
  stepLengthM: number;
  aiProvider: AIProvider;
  aiModel: string;
};
