import { describe, expect, it } from "vitest";

import { averagePaceSecPerKm, distanceBetweenMeters, elapsedMs, estimateSteps, formatDuration, formatPace } from "../lib/forja/metrics";
import type { LiveCardioSession, RoutePoint } from "../lib/forja/types";

const origin: RoutePoint = { latitude: -23.55052, longitude: -46.633308, timestamp: 1_000 };

function makeSession(overrides: Partial<LiveCardioSession> = {}): LiveCardioSession {
  return {
    id: "live-1",
    mode: "corrida",
    status: "running",
    startedAt: 1_000,
    resumedAt: 10_000,
    elapsedBeforePauseMs: 5_000,
    distanceM: 0,
    steps: 0,
    stepSource: "estimativa",
    route: [origin],
    currentLocation: origin,
    locationAccuracy: 10,
    ...overrides,
  };
}

describe("métricas do cardio", () => {
  it("calcula a distância aproximada entre duas coordenadas", () => {
    const destination: RoutePoint = { latitude: -23.55052, longitude: -46.623308, timestamp: 2_000 };
    const distance = distanceBetweenMeters(origin, destination);

    expect(distance).toBeGreaterThan(1_000);
    expect(distance).toBeLessThan(1_100);
  });

  it("acumula tempo somente enquanto a sessão está ativa", () => {
    expect(elapsedMs(makeSession(), 18_000)).toBe(13_000);
    expect(elapsedMs(makeSession({ status: "paused", elapsedBeforePauseMs: 27_000 }), 90_000)).toBe(27_000);
  });

  it("calcula e formata ritmo médio de forma segura", () => {
    expect(averagePaceSecPerKm(300_000, 1_000)).toBe(300);
    expect(averagePaceSecPerKm(12_000, 19)).toBeNull();
    expect(formatPace(300)).toBe("05:00");
    expect(formatPace(null)).toBe("—");
  });

  it("formata a duração para exibição de cronômetro", () => {
    expect(formatDuration(3_661_000)).toBe("01:01:01");
  });

  it("estima passos com limites seguros quando o pedômetro não está disponível", () => {
    expect(estimateSteps(750, 0.75)).toBe(1_000);
    expect(estimateSteps(100, 0.1)).toBe(250);
    expect(estimateSteps(-50, 0.75)).toBe(0);
  });
});
