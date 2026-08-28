import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";
import { Pedometer } from "expo-sensors";

import { averagePaceSecPerKm, createId, distanceBetweenMeters, elapsedMs } from "@/lib/forja/metrics";
import type { CardioMode, CardioSession, ForjaPreferences, LiveCardioSession, RoutePoint } from "@/lib/forja/types";

type Subscription = { remove: () => void };

function toRoutePoint(location: Location.LocationObject): RoutePoint {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    timestamp: location.timestamp,
    accuracy: location.coords.accuracy,
  };
}

export function useCardioTracker(preferences: ForjaPreferences) {
  const [draft, setDraft] = useState<LiveCardioSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const liveRef = useRef<LiveCardioSession | null>(null);
  const locationSubscription = useRef<Subscription | null>(null);
  const pedometerSubscription = useRef<Subscription | null>(null);
  const pedometerBaseSteps = useRef(0);

  const updateDraft = useCallback((updater: (current: LiveCardioSession) => LiveCardioSession) => {
    const current = liveRef.current;
    if (!current) return;
    const next = updater(current);
    liveRef.current = next;
    setDraft(next);
  }, []);

  const stopPedometer = useCallback(() => {
    pedometerSubscription.current?.remove();
    pedometerSubscription.current = null;
  }, []);

  const startPedometer = useCallback(async (sessionId: string, baseSteps: number) => {
    stopPedometer();
    pedometerBaseSteps.current = baseSteps;

    if (Platform.OS === "web" || !preferences.usePedometer) return false;

    try {
      const available = await Pedometer.isAvailableAsync();
      if (!available) return false;

      const permission = await Pedometer.requestPermissionsAsync();
      if (!permission.granted) return false;

      pedometerSubscription.current = Pedometer.watchStepCount((result) => {
        const current = liveRef.current;
        if (!current || current.id !== sessionId || current.status !== "running") return;
        const sensorSteps = Number.isFinite(result.steps) ? Math.max(0, Math.floor(result.steps)) : 0;
        updateDraft((latest) => ({
          ...latest,
          steps: pedometerBaseSteps.current + sensorSteps,
          stepSource: "sensor",
        }));
      });

      updateDraft((current) => current.id === sessionId ? { ...current, stepSource: "sensor" } : current);
      return true;
    } catch {
      stopPedometer();
      return false;
    }
  }, [preferences.usePedometer, stopPedometer, updateDraft]);

  const stopAllTracking = useCallback(() => {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    stopPedometer();
  }, [stopPedometer]);

  const receiveLocation = useCallback(
    (location: Location.LocationObject) => {
      const nextPoint = toRoutePoint(location);
      updateDraft((current) => {
        const accuracy = nextPoint.accuracy ?? null;
        const withPosition = { ...current, currentLocation: nextPoint, locationAccuracy: accuracy };

        if (current.status !== "running" || (accuracy !== null && accuracy > 55)) return withPosition;

        const previousPoint = current.route[current.route.length - 1];
        if (!previousPoint) return { ...withPosition, route: [nextPoint] };

        const segmentM = distanceBetweenMeters(previousPoint, nextPoint);
        const secondsSincePrevious = Math.max(1, (nextPoint.timestamp - previousPoint.timestamp) / 1000);
        const speedMps = segmentM / secondsSincePrevious;
        if (segmentM < 1 || speedMps > 15) return withPosition;

        const distanceM = current.distanceM + segmentM;
        const route = [...current.route, nextPoint].slice(-5_000);
        return { ...withPosition, distanceM, route };
      });
    },
    [updateDraft],
  );

  const start = useCallback(
    async (mode: CardioMode): Promise<boolean> => {
      setError(null);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setError("A localização é necessária para registrar distância e trajeto. Ative a permissão nas configurações do aparelho.");
        return false;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError("Ative os serviços de localização do aparelho para iniciar o treino.");
        return false;
      }

      try {
        const lastKnownLocation = await Location.getLastKnownPositionAsync({ maxAge: 60_000, requiredAccuracy: 80 });
        const firstLocation = lastKnownLocation ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const initialPoint = toRoutePoint(firstLocation);
        const startedAt = Date.now();
        const nextDraft: LiveCardioSession = {
          id: createId("live"),
          mode,
          status: "running",
          startedAt,
          resumedAt: startedAt,
          elapsedBeforePauseMs: 0,
          distanceM: 0,
          steps: 0,
          stepSource: "indisponivel",
          route: [initialPoint],
          currentLocation: initialPoint,
          locationAccuracy: initialPoint.accuracy ?? null,
        };

        liveRef.current = nextDraft;
        setDraft(nextDraft);
        locationSubscription.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 1, timeInterval: 1_000, mayShowUserSettingsDialog: true },
          receiveLocation,
          () => setError("O sinal de localização foi interrompido. Confira o GPS e tente novamente."),
        );
        await startPedometer(nextDraft.id, 0);
        return true;
      } catch {
        setError("Não foi possível obter uma posição precisa. Aguarde o GPS estabilizar e tente novamente.");
        stopAllTracking();
        liveRef.current = null;
        setDraft(null);
        return false;
      }
    },
    [receiveLocation, startPedometer, stopAllTracking],
  );

  const pause = useCallback(() => {
    const current = liveRef.current;
    if (!current) return;
    stopPedometer();
    pedometerBaseSteps.current = current.steps;
    updateDraft((latest) => ({ ...latest, status: "paused", elapsedBeforePauseMs: elapsedMs(latest) }));
  }, [stopPedometer, updateDraft]);

  const resume = useCallback(async () => {
    const current = liveRef.current;
    if (!current) return;
    const resumedAt = Date.now();
    updateDraft((latest) => ({ ...latest, status: "running", resumedAt }));
    await startPedometer(current.id, current.steps);
  }, [startPedometer, updateDraft]);

  const finish = useCallback((): CardioSession | null => {
    const live = liveRef.current;
    if (!live) return null;

    const durationMs = elapsedMs(live);
    const session: CardioSession = {
      id: createId("cardio"),
      mode: live.mode,
      createdAt: new Date().toISOString(),
      startedAt: live.startedAt,
      durationMs,
      distanceM: live.distanceM,
      averagePaceSecPerKm: averagePaceSecPerKm(durationMs, live.distanceM),
      steps: live.stepSource === "sensor" ? live.steps : 0,
      stepSource: live.stepSource,
      route: live.route,
    };

    stopAllTracking();
    liveRef.current = null;
    setDraft(null);
    return session;
  }, [stopAllTracking]);

  const discard = useCallback(() => {
    stopAllTracking();
    liveRef.current = null;
    setDraft(null);
  }, [stopAllTracking]);

  useEffect(() => {
    if (draft?.status !== "running") return;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [draft?.status]);

  useEffect(() => stopAllTracking, [stopAllTracking]);

  const durationMs = useMemo(() => (draft ? elapsedMs(draft, now) : 0), [draft, now]);
  const currentPace = useMemo(() => (draft ? averagePaceSecPerKm(durationMs, draft.distanceM) : null), [draft, durationMs]);

  return { draft, error, durationMs, currentPace, start, pause, resume, finish, discard };
}
