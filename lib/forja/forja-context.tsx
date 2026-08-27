import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { readStoredValue, saveStoredValue } from "@/lib/forja/storage";
import type { CardioSession, ForjaPreferences } from "@/lib/forja/types";

const STORAGE_KEYS = {
  sessions: "forja.mobile.cardio.sessions.v1",
  preferences: "forja.mobile.preferences.v1",
} as const;

const DEFAULT_PREFERENCES: ForjaPreferences = {
  usePedometer: true,
  stepLengthM: 0.75,
  aiProvider: "manus",
  aiModel: "manus-1.6-lite",
};

type ForjaContextValue = {
  hydrated: boolean;
  sessions: CardioSession[];
  preferences: ForjaPreferences;
  addSession: (session: CardioSession) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearSessions: () => Promise<void>;
  updatePreferences: (changes: Partial<ForjaPreferences>) => Promise<void>;
};

const ForjaContext = createContext<ForjaContextValue | null>(null);

export function ForjaProvider({ children }: PropsWithChildren) {
  const [hydrated, setHydrated] = useState(false);
  const [sessions, setSessions] = useState<CardioSession[]>([]);
  const [preferences, setPreferences] = useState<ForjaPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const [storedSessions, storedPreferences] = await Promise.all([
        readStoredValue<CardioSession[]>(STORAGE_KEYS.sessions, []),
        readStoredValue<ForjaPreferences>(STORAGE_KEYS.preferences, DEFAULT_PREFERENCES),
      ]);

      if (!mounted) {
        return;
      }

      setSessions(storedSessions.sort((a, b) => b.startedAt - a.startedAt));
      setPreferences({ ...DEFAULT_PREFERENCES, ...storedPreferences });
      setHydrated(true);
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const addSession = useCallback(async (session: CardioSession) => {
    setSessions((current) => {
      const next = [session, ...current].sort((a, b) => b.startedAt - a.startedAt);
      void saveStoredValue(STORAGE_KEYS.sessions, next);
      return next;
    });
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    setSessions((current) => {
      const next = current.filter((session) => session.id !== sessionId);
      void saveStoredValue(STORAGE_KEYS.sessions, next);
      return next;
    });
  }, []);

  const clearSessions = useCallback(async () => {
    setSessions([]);
    await saveStoredValue(STORAGE_KEYS.sessions, []);
  }, []);

  const updatePreferences = useCallback(async (changes: Partial<ForjaPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...changes };
      void saveStoredValue(STORAGE_KEYS.preferences, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      sessions,
      preferences,
      addSession,
      deleteSession,
      clearSessions,
      updatePreferences,
    }),
    [addSession, clearSessions, deleteSession, hydrated, preferences, sessions, updatePreferences],
  );

  return <ForjaContext.Provider value={value}>{children}</ForjaContext.Provider>;
}

export function useForja(): ForjaContextValue {
  const context = useContext(ForjaContext);
  if (!context) {
    throw new Error("useForja deve ser usado dentro de ForjaProvider.");
  }

  return context;
}
