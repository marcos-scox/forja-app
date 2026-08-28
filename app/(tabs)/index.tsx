import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card, Metric, SectionHeading, forjaColors } from "@/components/forja-ui";
import { ScreenContainer } from "@/components/screen-container";
import { formatDistance, formatDuration } from "@/lib/forja/metrics";
import { useForja } from "@/lib/forja/forja-context";

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function TrainingScreen() {
  const { hydrated, sessions } = useForja();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const totalDistance = sessions.reduce((sum, session) => sum + session.distanceM, 0);
  const totalDuration = sessions.reduce((sum, session) => sum + session.durationMs, 0);
  const runPhotoByDay = useMemo(() => {
    const photos = new Map<string, string>();
    sessions.filter((session) => session.mode === "corrida").forEach((session) => {
      const dayKey = localDateKey(new Date(session.createdAt));
      if (session.selfieUri && !photos.has(dayKey)) photos.set(dayKey, session.selfieUri);
    });
    return photos;
  }, [sessions]);
  const runDays = useMemo(() => new Set(sessions.filter((session) => session.mode === "corrida").map((session) => localDateKey(new Date(session.createdAt)))), [sessions]);
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const calendarCells = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : index - firstDay + 1);

  function changeMonth(delta: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>FORJA</Text>
            <Text style={styles.title}>Treine com intenção.</Text>
            <Text style={styles.subtitle}>O progresso se constrói uma sessão por vez.</Text>
          </View>
          <View style={styles.brandMark}><MaterialIcons color={forjaColors.background} name="bolt" size={24} /></View>
        </View>

        <Card style={styles.summaryCard}>
          <SectionHeading eyebrow="Seu resumo" title="Movimento registrado" />
          <View style={styles.metricsRow}>
            <Metric accent label="sessões" value={hydrated ? String(sessions.length) : "—"} />
            <View style={styles.metricDivider} />
            <Metric label="km totais" value={hydrated ? formatDistance(totalDistance) : "—"} />
            <View style={styles.metricDivider} />
            <Metric label="tempo" value={hydrated ? formatDuration(totalDuration).slice(0, 5) : "—"} />
          </View>
        </Card>

        <View style={styles.spacer} />
        <Card style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <View><Text style={styles.calendarEyebrow}>AGENDA DE CORRIDAS</Text><Text style={styles.calendarTitle}>{monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}</Text></View>
            <View style={styles.monthControls}>
              <Pressable accessibilityLabel="Mês anterior" accessibilityRole="button" onPress={() => changeMonth(-1)} style={({ pressed }) => [styles.monthButton, pressed && styles.monthButtonPressed]}><MaterialIcons color={forjaColors.text} name="chevron-left" size={22} /></Pressable>
              <Pressable accessibilityLabel="Próximo mês" accessibilityRole="button" onPress={() => changeMonth(1)} style={({ pressed }) => [styles.monthButton, pressed && styles.monthButtonPressed]}><MaterialIcons color={forjaColors.text} name="chevron-right" size={22} /></Pressable>
            </View>
          </View>
          <View style={styles.weekRow}>{weekDays.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>)}</View>
          <View style={styles.calendarGrid}>
            {calendarCells.map((day, index) => {
              if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
              const key = localDateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
              const hasRun = runDays.has(key);
              const isToday = key === localDateKey(new Date());
              const photoUri = runPhotoByDay.get(key);
              return <View key={key} style={styles.dayCell}><Pressable accessibilityLabel={photoUri ? `Abrir selfie do dia ${day}` : `Dia ${day}`} accessibilityRole={photoUri ? "button" : undefined} disabled={!photoUri} onPress={() => photoUri && setSelectedPhoto(photoUri)}><View style={[styles.dayCircle, isToday && styles.todayCircle, hasRun && styles.runCircle, photoUri && styles.photoCircle]}>{photoUri ? <Image accessibilityLabel={`Selfie da corrida do dia ${day}`} source={{ uri: photoUri }} style={styles.dayPhoto} /> : null}{photoUri ? <View style={styles.dayPhotoShade} /> : null}<Text style={[styles.dayText, hasRun && styles.runText, photoUri && styles.photoDayText, isToday && !hasRun && styles.todayText]}>{day}</Text></View></Pressable>{hasRun ? <View style={styles.runDot} /> : null}</View>;
            })}
          </View>
          <View style={styles.calendarLegend}><View style={styles.legendItem}><View style={styles.legendDot} /><Text style={styles.legendText}>Corrida registrada</Text></View><Text style={styles.runCount}>{sessions.filter((session) => session.mode === "corrida" && new Date(session.createdAt).getMonth() === visibleMonth.getMonth() && new Date(session.createdAt).getFullYear() === visibleMonth.getFullYear()).length} neste mês</Text></View>
        </Card>

        <View style={styles.spacer} />
        <Card style={styles.cardioCallout}>
          <View style={styles.cardioIcon}><MaterialIcons color={forjaColors.background} name="directions-run" size={25} /></View>
          <View style={styles.cardioCopy}><Text style={styles.cardioTitle}>Cardio com GPS</Text><Text style={styles.cardioBody}>Acompanhe mapa, distância, tempo, ritmo e passos em tempo real.</Text></View>
          <Pressable accessibilityRole="button" onPress={() => router.push("/cardio" as Href)} style={({ pressed }) => [styles.arrowButton, pressed && styles.arrowButtonPressed]}><MaterialIcons color={forjaColors.background} name="arrow-forward" size={21} /></Pressable>
        </Card>
      </ScrollView>
      <Modal animationType="fade" onRequestClose={() => setSelectedPhoto(null)} transparent visible={Boolean(selectedPhoto)}>
        <Pressable accessibilityLabel="Fechar selfie ampliada" accessibilityRole="button" onPress={() => setSelectedPhoto(null)} style={styles.photoModalBackdrop}>
          {selectedPhoto ? <Image accessibilityLabel="Selfie ampliada da corrida" resizeMode="contain" source={{ uri: selectedPhoto }} style={styles.photoModalImage} /> : null}
          <Text style={styles.photoModalHint}>Toque para fechar</Text>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34 },
  header: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  kicker: { color: forjaColors.lime, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  title: { color: forjaColors.text, fontSize: 29, fontWeight: "900", letterSpacing: -1.1, marginTop: 7 },
  subtitle: { color: forjaColors.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  brandMark: { alignItems: "center", backgroundColor: forjaColors.lime, borderRadius: 16, height: 48, justifyContent: "center", width: 48 },
  summaryCard: { paddingBottom: 17 },
  metricsRow: { alignItems: "stretch", flexDirection: "row" },
  metricDivider: { backgroundColor: forjaColors.border, width: 1 },
  spacer: { height: 16 },
  calendarCard: { padding: 16 },
  calendarHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  calendarEyebrow: { color: forjaColors.lime, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  calendarTitle: { color: forjaColors.text, fontSize: 18, fontWeight: "900", marginTop: 5 },
  monthControls: { flexDirection: "row", gap: 5 },
  monthButton: { alignItems: "center", backgroundColor: forjaColors.surfaceElevated, borderRadius: 10, height: 36, justifyContent: "center", width: 36 },
  monthButtonPressed: { opacity: 0.65 },
  weekRow: { flexDirection: "row", marginTop: 22 },
  weekDay: { color: forjaColors.muted, flex: 1, fontSize: 11, fontWeight: "800", textAlign: "center" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  dayCell: { alignItems: "center", height: 46, justifyContent: "flex-start", width: "14.2857%" },
  dayCircle: { alignItems: "center", borderRadius: 18, height: 34, justifyContent: "center", overflow: "hidden", width: 34 },
  photoCircle: { borderColor: forjaColors.lime, borderWidth: 2 },
  dayPhoto: { height: "100%", left: 0, position: "absolute", top: 0, width: "100%" },
  dayPhotoShade: { backgroundColor: "rgba(0,0,0,0.35)", height: "100%", position: "absolute", width: "100%" },
  photoDayText: { color: "#FFFFFF", fontWeight: "900" },
  photoModalBackdrop: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.92)", flex: 1, justifyContent: "center", padding: 24 },
  photoModalImage: { borderRadius: 22, height: "78%", width: "100%" },
  photoModalHint: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", marginTop: 14 },
  todayCircle: { borderColor: forjaColors.lime, borderWidth: 1 },
  runCircle: { backgroundColor: forjaColors.lime },
  dayText: { color: forjaColors.text, fontSize: 12, fontWeight: "700" },
  todayText: { color: forjaColors.lime },
  runText: { color: forjaColors.background, fontWeight: "900" },
  runDot: { backgroundColor: forjaColors.lime, borderRadius: 99, height: 4, marginTop: 4, width: 4 },
  calendarLegend: { alignItems: "center", borderTopColor: forjaColors.border, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 7, paddingTop: 13 },
  legendItem: { alignItems: "center", flexDirection: "row", gap: 7 },
  legendDot: { backgroundColor: forjaColors.lime, borderRadius: 99, height: 7, width: 7 },
  legendText: { color: forjaColors.muted, fontSize: 11 },
  runCount: { color: forjaColors.lime, fontSize: 11, fontWeight: "800" },
  cardioCallout: { alignItems: "center", backgroundColor: forjaColors.surfaceElevated, flexDirection: "row", gap: 13 },
  cardioIcon: { alignItems: "center", backgroundColor: forjaColors.lime, borderRadius: 14, height: 49, justifyContent: "center", width: 49 },
  cardioCopy: { flex: 1 },
  cardioTitle: { color: forjaColors.text, fontSize: 16, fontWeight: "900" },
  cardioBody: { color: forjaColors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  arrowButton: { alignItems: "center", backgroundColor: forjaColors.lime, borderRadius: 14, height: 44, justifyContent: "center", width: 44 },
  arrowButtonPressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
});
