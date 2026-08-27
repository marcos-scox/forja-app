import type { LiveCardioSession, RoutePoint } from "@/lib/forja/types";

const EARTH_RADIUS_M = 6_371_000;

export function distanceBetweenMeters(from: RoutePoint, to: RoutePoint): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const latitudeFrom = toRadians(from.latitude);
  const latitudeTo = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeFrom) * Math.cos(latitudeTo) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

export function elapsedMs(session: LiveCardioSession, now = Date.now()): number {
  if (session.status === "paused") {
    return session.elapsedBeforePauseMs;
  }

  return session.elapsedBeforePauseMs + Math.max(0, now - session.resumedAt);
}

export function averagePaceSecPerKm(durationMs: number, distanceM: number): number | null {
  if (distanceM < 20) {
    return null;
  }

  return Math.round((durationMs / 1000) / (distanceM / 1000));
}

export function estimateSteps(distanceM: number, stepLengthM: number): number {
  const safeDistance = Number.isFinite(distanceM) ? Math.max(0, distanceM) : 0;
  const safeStepLength = Number.isFinite(stepLengthM) ? Math.min(1.4, Math.max(0.4, stepLengthM)) : 0.75;
  return Math.round(safeDistance / safeStepLength);
}

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function formatDistance(distanceM: number): string {
  return (distanceM / 1000).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPace(paceSecPerKm: number | null): string {
  if (!paceSecPerKm || !Number.isFinite(paceSecPerKm)) {
    return "—";
  }

  const minutes = Math.floor(paceSecPerKm / 60);
  const seconds = Math.round(paceSecPerKm % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
