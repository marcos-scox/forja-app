import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const SELFIE_DIRECTORY = "forja-selfies/";

export async function persistSelfie(uri: string, sessionId: string): Promise<string> {
  if (Platform.OS === "web" || !FileSystem.documentDirectory) return uri;

  const directory = `${FileSystem.documentDirectory}${SELFIE_DIRECTORY}`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

  const extension = uri.split(".").pop()?.split("?")[0]?.toLowerCase();
  const safeExtension = extension && /^[a-z0-9]+$/.test(extension) ? extension : "jpg";
  const destination = `${directory}${sessionId}.${safeExtension}`;
  await FileSystem.copyAsync({ from: uri, to: destination });
  return destination;
}
