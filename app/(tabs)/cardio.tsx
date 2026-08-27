import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake";
import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card, Metric, PrimaryButton, SectionHeading, StatusChip, forjaColors } from "@/components/forja-ui";
import { LeafletMap } from "@/components/map/leaflet-map";
import { ScreenContainer } from "@/components/screen-container";
import { formatDistance, formatDuration, formatPace } from "@/lib/forja/metrics";
import { useForja } from "@/lib/forja/forja-context";
import type { CardioMode } from "@/lib/forja/types";
import { useCardioTracker } from "@/hooks/use-cardio-tracker";

const modes: { key: CardioMode; label: string; icon: "directions-run" | "directions-walk" | "directions-bike" }[] = [
  { key: "corrida", label: "Corrida", icon: "directions-run" },
  { key: "caminhada", label: "Caminhada", icon: "directions-walk" },
  { key: "ciclismo", label: "Ciclismo", icon: "directions-bike" },
];

export default function CardioScreen() {
  const { addSession, preferences } = useForja();
  const [mode, setMode] = useState<CardioMode>("corrida");
  const { draft, error, durationMs, currentPace, start, pause, resume, finish } = useCardioTracker(preferences);

  useEffect(() => {
    if (draft?.status === "running" && Platform.OS !== "web") {
      void activateKeepAwake("forja-cardio");
      return () => {
        void deactivateKeepAwake("forja-cardio");
      };
    }
  }, [draft?.status]);

  async function handleStart() {
    await start(mode);
  }

  function handleFinish() {
    const session = finish();
    if (!session) {
      return;
    }
    void addSession(session);
    Alert.alert("Sessão salva", "Sua rota e suas métricas foram armazenadas neste aparelho.", [
      { text: "Continuar" },
      { text: "Ver histórico", onPress: () => router.navigate("/history" as Href) },
    ]);
  }

  const accuracyLabel = !draft?.locationAccuracy
    ? "GPS aguardando"
    : draft.locationAccuracy <= 12
      ? `GPS forte · ±${Math.round(draft.locationAccuracy)} m`
      : draft.locationAccuracy <= 30
        ? `GPS médio · ±${Math.round(draft.locationAccuracy)} m`
        : `GPS instável · ±${Math.round(draft.locationAccuracy)} m`;

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topLine}>
          <View>
            <Text style={styles.kicker}>CARDIO</Text>
            <Text style={styles.title}>{draft ? "Sessão em andamento" : "Vá além do ponto de partida."}</Text>
          </View>
          <StatusChip label={draft?.status === "running" ? "AO VIVO" : draft ? "PAUSADO" : "PRONTO"} tone={draft?.status === "running" ? "active" : draft ? "warning" : "neutral"} />
        </View>
        <Text style={styles.subtitle}>{draft ? accuracyLabel : "Selecione a modalidade e inicie um treino com GPS em tempo real."}</Text>

        {!draft ? (
          <View style={styles.modeList}>
            {modes.map((item) => {
              const active = item.key === mode;
              return (
                <Pressable key={item.key} accessibilityRole="button" onPress={() => setMode(item.key)} style={({ pressed }) => [styles.modeButton, active && styles.modeButtonActive, pressed && styles.modeButtonPressed]}>
                  <MaterialIcons color={active ? forjaColors.background : forjaColors.lime} name={item.icon} size={21} />
                  <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.mapCard}>
          <LeafletMap currentLocation={draft?.currentLocation} followUser={draft?.status === "running"} route={draft?.route ?? []} />
          <View style={styles.mapBadge}>
            <View style={[styles.mapStatusDot, draft?.locationAccuracy && draft.locationAccuracy <= 30 ? styles.mapStatusDotActive : styles.mapStatusDotMuted]} />
            <Text style={styles.mapBadgeText}>{draft ? accuracyLabel : "Mapa pronto para o treino"}</Text>
          </View>
        </View>

        <View style={styles.metricsCard}>
          <View style={styles.metricsRow}>
            <Metric accent label="distância" suffix="km" value={formatDistance(draft?.distanceM ?? 0)} />
            <View style={styles.metricDivider} />
            <Metric label="tempo" value={formatDuration(durationMs)} />
          </View>
          <View style={styles.horizontalDivider} />
          <View style={styles.metricsRow}>
            <Metric label="ritmo" suffix="/km" value={formatPace(currentPace)} />
            <View style={styles.metricDivider} />
            <Metric label={draft?.stepSource === "sensor" ? "passos" : "passos estimados"} value={(draft?.steps ?? 0).toLocaleString("pt-BR")} />
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <MaterialIcons color={forjaColors.warning} name="location-off" size={21} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.controls}>
          {!draft ? <PrimaryButton icon="play-arrow" onPress={() => void handleStart()} title="Iniciar treino" /> : null}
          {draft?.status === "running" ? <PrimaryButton icon="pause" onPress={pause} title="Pausar" variant="secondary" /> : null}
          {draft?.status === "paused" ? <PrimaryButton icon="play-arrow" onPress={() => void resume()} title="Retomar" /> : null}
          {draft ? <PrimaryButton icon="save" onPress={handleFinish} title="Finalizar e salvar" variant="danger" /> : null}
        </View>

        <View style={styles.gap} />
        <Card>
          <SectionHeading eyebrow="Como funciona" title="Registro consciente" />
          <View style={styles.infoRow}>
            <MaterialIcons color={forjaColors.lime} name="my-location" size={21} />
            <Text style={styles.infoText}>O Forja usa a localização somente durante a sessão ativa para desenhar o trajeto e calcular a distância.</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons color={forjaColors.lime} name="directions-walk" size={21} />
            <Text style={styles.infoText}>Passos vêm do pedômetro quando ele estiver disponível; caso contrário, são estimados pela distância registrada.</Text>
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 34 },
  topLine: { alignItems: "flex-start", flexDirection: "row", gap: 12, justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 4 },
  kicker: { color: forjaColors.lime, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  title: { color: forjaColors.text, fontSize: 26, fontWeight: "900", letterSpacing: -1, lineHeight: 31, marginTop: 7, maxWidth: 280 },
  subtitle: { color: forjaColors.muted, fontSize: 13, lineHeight: 19, marginHorizontal: 20, marginTop: 7 },
  modeList: { flexDirection: "row", gap: 8, marginHorizontal: 20, marginTop: 20 },
  modeButton: { alignItems: "center", backgroundColor: forjaColors.surface, borderColor: forjaColors.border, borderRadius: 14, borderWidth: 1, flex: 1, gap: 5, minHeight: 58, justifyContent: "center", paddingHorizontal: 8 },
  modeButtonActive: { backgroundColor: forjaColors.lime, borderColor: forjaColors.lime },
  modeButtonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  modeLabel: { color: forjaColors.text, fontSize: 11, fontWeight: "800" },
  modeLabelActive: { color: forjaColors.background },
  mapCard: { backgroundColor: forjaColors.map, borderColor: forjaColors.border, borderRadius: 22, borderWidth: 1, height: 302, marginHorizontal: 20, marginTop: 20, overflow: "hidden" },
  mapBadge: { alignItems: "center", backgroundColor: "rgba(10, 13, 12, 0.84)", borderColor: "rgba(244,247,242,0.15)", borderRadius: 12, borderWidth: 1, bottom: 12, flexDirection: "row", gap: 7, left: 12, paddingHorizontal: 10, paddingVertical: 7, position: "absolute" },
  mapStatusDot: { borderRadius: 99, height: 7, width: 7 },
  mapStatusDotActive: { backgroundColor: forjaColors.lime },
  mapStatusDotMuted: { backgroundColor: forjaColors.muted },
  mapBadgeText: { color: forjaColors.text, fontSize: 10, fontWeight: "700" },
  metricsCard: { backgroundColor: forjaColors.surface, borderColor: forjaColors.border, borderRadius: 20, borderWidth: 1, marginHorizontal: 20, marginTop: 14, paddingVertical: 17 },
  metricsRow: { alignItems: "stretch", flexDirection: "row", paddingHorizontal: 12 },
  metricDivider: { backgroundColor: forjaColors.border, width: 1 },
  horizontalDivider: { backgroundColor: forjaColors.border, height: 1, marginHorizontal: 18, marginVertical: 16 },
  errorBox: { alignItems: "flex-start", backgroundColor: "rgba(255, 183, 74, 0.10)", borderColor: "rgba(255, 183, 74, 0.25)", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, marginHorizontal: 20, marginTop: 14, padding: 14 },
  errorText: { color: forjaColors.warning, flex: 1, fontSize: 12, lineHeight: 18 },
  controls: { gap: 10, marginHorizontal: 20, marginTop: 14 },
  gap: { height: 25 },
  infoRow: { alignItems: "flex-start", flexDirection: "row", gap: 12, marginTop: 13 },
  infoText: { color: forjaColors.muted, flex: 1, fontSize: 12, lineHeight: 19 },
});
