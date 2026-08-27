import AsyncStorage from "@react-native-async-storage/async-storage";

export async function readStoredValue<T>(key: string, fallback: T): Promise<T> {
  try {
    const rawValue = await AsyncStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveStoredValue<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
