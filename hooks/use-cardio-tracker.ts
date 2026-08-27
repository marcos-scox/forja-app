import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import { Pedometer } from "expo-sensors";

import { averagePaceSecPerKm, createId, distanceBetweenMeters, elapsedMs, estimateSteps } from "@/lib/forja/metrics";
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
  const pedometerBase = useRef(0);
  const lastPedometerReading = useRef(0);

  const updateDraft = useCallback((updater: (current: LiveCardioSession) => LiveCardioSession) => {
    const current = liveRef.current;
    if (!current) {
      return;
    }
    const next = updater(current);
    liveRef.current = next;
    setDraft(next);
  }, []);

  const stopPedometer = useCallback(() => {
    pedometerSubscription.current?.remove();
    pedometerSubscription.current = null;
  }, []);

  const beginPedometer = useCallback(async () => {
    stopPedometer();
    if (!preferences.usePedometer || !liveRef.current) {
      return;
    }

    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (!isAvailable) {
        updateDraft((current) => ({ ...current, stepSource: "estimativa" }));
        return;
      }

      const existingPermission = await Pedometer.getPermissionsAsync();
      const permission = existingPermission.granted ? existingPermission : await Pedometer.requestPermissionsAsync();
      if (!permission.granted) {
        updateDraft((current) => ({ ...current, stepSource: "estimativa" }));
        return;
      }

      pedometerBase.current = liveRef.current.steps;
      lastPedometerReading.current = 0;
      pedometerSubscription.current = Pedometer.watchStepCount(({ steps }) => {
        updateDraft((current) => {
          if (current.status !== "running") {
            return current;
          }
          const normalizedSteps = Math.max(lastPedometerReading.current, steps);
          lastPedometerReading.current = normalizedSteps;
          return { ...current, steps: Math.max(current.steps, pedometerBase.current + normalizedSteps), stepSource: "sensor" };
        });
      });
    } catch {
      updateDraft((current) => ({ ...current, stepSource: "estimativa" }));
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

        if (current.status !== "running" || (accuracy !== null && accuracy > 55)) {
          return withPosition;
        }

        const previousPoint = current.route[current.route.length - 1];
        if (!previousPoint) {
          return { ...withPosition, route: [nextPoint] };
        }

        const segmentM = distanceBetweenMeters(previousPoint, nextPoint);
        const secondsSincePrevious = Math.max(1, (nextPoint.timestamp - previousPoint.timestamp) / 1000);
        const speedMps = segmentM / secondsSincePrevious;
        if (segmentM < 1 || speedMps > 15) {
          return withPosition;
        }

        const distanceM = current.distanceM + segmentM;
        const route = [...current.route, nextPoint].slice(-5_000);
        const estimatedSteps = estimateSteps(distanceM, preferences.stepLengthM);
        return {
          ...withPosition,
          distanceM,
          route,
          steps: current.stepSource === "sensor" ? Math.max(current.steps, estimatedSteps) : estimatedSteps,
        };
      });
    },
    [preferences.stepLengthM, updateDraft],
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
          stepSource: "estimativa",
          route: [initialPoint],
          currentLocation: initialPoint,
          locationAccuracy: initialPoint.accuracy ?? null,
        };

        liveRef.current = nextDraft;
        setDraft(nextDraft);
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 1,
            timeInterval: 1_000,
            mayShowUserSettingsDialog: true,
          },
          receiveLocation,
          () => setError("O sinal de localização foi interrompido. Confira o GPS e tente novamente."),
        );
        await beginPedometer();
        return true;
      } catch {
        setError("Não foi possível obter uma posição precisa. Aguarde o GPS estabilizar e tente novamente.");
        stopAllTracking();
        liveRef.current = null;
        setDraft(null);
        return false;
      }
    },
    [beginPedometer, preferences.usePedometer, receiveLocation, stopAllTracking],
  );

  const pause = useCallback(() => {
    updateDraft((current) => ({
      ...current,
      status: "paused",
      elapsedBeforePauseMs: elapsedMs(current),
    }));
    stopPedometer();
  }, [stopPedometer, updateDraft]);

  const resume = useCallback(async () => {
    updateDraft((current) => ({ ...current, status: "running", resumedAt: Date.now() }));
    await beginPedometer();
  }, [beginPedometer, updateDraft]);

  const finish = useCallback((): CardioSession | null => {
    const live = liveRef.current;
    if (!live) {
      return null;
    }

    const durationMs = elapsedMs(live);
    const estimatedSteps = estimateSteps(live.distanceM, preferences.stepLengthM);
    const session: CardioSession = {
      id: createId("cardio"),
      mode: live.mode,
      createdAt: new Date().toISOString(),
      startedAt: live.startedAt,
      durationMs,
      distanceM: live.distanceM,
      averagePaceSecPerKm: averagePaceSecPerKm(durationMs, live.distanceM),
      steps: live.stepSource === "sensor" ? live.steps : estimatedSteps,
      stepSource: live.stepSource,
      route: live.route,
    };

    stopAllTracking();
    liveRef.current = null;
    setDraft(null);
    return session;
  }, [preferences.stepLengthM, stopAllTracking]);

  const discard = useCallback(() => {
    stopAllTracking();
    liveRef.current = null;
    setDraft(null);
  }, [stopAllTracking]);

  useEffect(() => {
    if (draft?.status !== "running") {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [draft?.status]);

  useEffect(() => stopAllTracking, [stopAllTracking]);

  const durationMs = useMemo(() => (draft ? elapsedMs(draft, now) : 0), [draft, now]);
  const currentPace = useMemo(() => (draft ? averagePaceSecPerKm(durationMs, draft.distanceM) : null), [draft, durationMs]);

  return { draft, error, durationMs, currentPace, start, pause, resume, finish, discard };
}
