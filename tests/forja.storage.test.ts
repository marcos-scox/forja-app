import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
  },
}));

import { readStoredValue, saveStoredValue } from "../lib/forja/storage";

describe("armazenamento local do Forja", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("persiste e recupera uma sessão serializável", async () => {
    const session = { id: "cardio-1", distanceM: 1_240, route: [{ latitude: -23.5, longitude: -46.6 }] };

    await saveStoredValue("forja.session", session);

    await expect(readStoredValue("forja.session", null)).resolves.toEqual(session);
  });

  it("retorna o valor padrão quando não houver dados", async () => {
    await expect(readStoredValue("forja.ausente", [])).resolves.toEqual([]);
  });
});
