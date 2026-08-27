import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { AIProvider } from "@/lib/forja/types";

const keyFor = (provider: AIProvider) => `forja.mobile.ai-key.${provider}.v1`;

function getWebStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export async function readAiApiKey(provider: AIProvider): Promise<string | null> {
  try {
    if (Platform.OS === "web") return getWebStorage()?.getItem(keyFor(provider)) ?? null;
    return SecureStore.getItemAsync(keyFor(provider));
  } catch {
    return null;
  }
}

export async function saveAiApiKey(provider: AIProvider, value: string): Promise<void> {
  const apiKey = value.trim();
  if (!apiKey) {
    await removeAiApiKey(provider);
    return;
  }

  if (Platform.OS === "web") {
    getWebStorage()?.setItem(keyFor(provider), apiKey);
    return;
  }
  await SecureStore.setItemAsync(keyFor(provider), apiKey);
}

export async function removeAiApiKey(provider: AIProvider): Promise<void> {
  if (Platform.OS === "web") {
    getWebStorage()?.removeItem(keyFor(provider));
    return;
  }
  await SecureStore.deleteItemAsync(keyFor(provider));
}
