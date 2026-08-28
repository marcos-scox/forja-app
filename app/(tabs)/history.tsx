import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, Metric, SectionHeading, forjaColors } from "@/components/forja-ui";
import { LeafletMap } from "@/components/map/leaflet-map";
import { ScreenContainer } from "@/components/screen-container";
import { formatDistance, formatDuration, formatPace } from "@/lib/forja/metrics";
import { useForja } from "@/lib/forja/forja-context";
import type { CardioSession } from "@/lib/forja/types";

const modeIcons = { corrida: "directions-run", caminhada: "directions-walk", ciclismo: "directions-bike" } as const;

export default function HistoryScreen() {
  const { sessions, deleteSession } = useForja();
  const [selectedId, setSelectedId] = useState<string | null>(sessions[0]?.id ?? null);
  const totalDistance = useMemo(() => sessions.reduce((sum, session) => sum + session.distanceM, 0), [sessions]);
  const totalDuration = useMemo(() => sessions.reduce((sum, session) => sum + session.durationMs, 0), [sessions]);
  const selected = sessions.find((session) => session.id === selectedId) ?? null;

  function confirmDelete(session: CardioSession) {
    Alert.alert("Excluir sessão", "A rota e as métricas desta sessão serão removidas do aparelho.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          if (selectedId === session.id) {
            setSelectedId(null);
          }
          void deleteSession(session.id);
        },
      },
    ]);
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <FlatList
        contentContainerStyle={styles.content}
        data={sessions}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyHistory />}
        ListFooterComponent={selected ? <RouteDetail session={selected} /> : null}
        ListHeaderComponent={
          <>
            <Text style={styles.kicker}>HISTÓRICO</Text>
            <Text style={styles.title}>Seu esforço deixa rastros.</Text>
            <Text style={styles.subtitle}>Todas as sessões ficam guardadas apenas neste dispositivo.</Text>
            <Card style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Metric accent label="sessões" value={String(sessions.length)} />
                <View style={styles.metricDivider} />
                <Metric label="distância" suffix="km" value={formatDistance(totalDistance)} />
                <View style={styles.metricDivider} />
                <Metric label="tempo" value={formatDuration(totalDuration).slice(0, 5)} />
              </View>
            </Card>
            {sessions.length ? <Text style={styles.listTitle}>Sessões registradas</Text> : null}
          </>
        }
        renderItem={({ item }) => (
          <SessionCard
            expanded={selectedId === item.id}
            onDelete={() => confirmDelete(item)}
            onPress={() => setSelectedId((current) => (current === item.id ? null : item.id))}
            session={item}
          />
        )}
        scrollEnabled
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

function SessionCard({ session, expanded, onPress, onDelete }: { session: CardioSession; expanded: boolean; onPress: () => void; onDelete: () => void }) {
  const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(session.createdAt));
  return (
    <Card style={[styles.sessionCard, expanded && styles.sessionCardExpanded]}>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.sessionPressable, pressed && styles.sessionPressed]}>
        <View style={styles.sessionIcon}>
          <MaterialIcons color={forjaColors.lime} name={modeIcons[session.mode]} size={22} />
        </View>
        <View style={styles.sessionCopy}>
          <Text style={styles.sessionTitle}>{session.mode.charAt(0).toUpperCase() + session.mode.slice(1)}</Text>
          <Text style={styles.sessionDate}>{date}</Text>
        </View>
        <MaterialIcons color={forjaColors.muted} name={expanded ? "expand-less" : "expand-more"} size={22} />
      </Pressable>
      <View style={styles.sessionMetrics}>
        <View>
          <Text style={styles.sessionMetricValue}>{formatDistance(session.distanceM)} <Text style={styles.sessionMetricUnit}>km</Text></Text>
          <Text style={styles.sessionMetricLabel}>distância</Text>
        </View>
        <View>
          <Text style={styles.sessionMetricValue}>{formatDuration(session.durationMs).slice(0, 5)}</Text>
          <Text style={styles.sessionMetricLabel}>duração</Text>
        </View>
        <View>
          <Text style={styles.sessionMetricValue}>{formatPace(session.averagePaceSecPerKm)}</Text>
          <Text style={styles.sessionMetricLabel}>ritmo /km</Text>
        </View>
      </View>
      {expanded && session.selfieUri ? (
        <View style={styles.selfieWrap}>
          <Image accessibilityLabel="Selfie da corrida" source={{ uri: session.selfieUri }} style={styles.selfieImage} />
          <Text style={styles.selfieCaption}>Selfie salva nesta sessão</Text>
        </View>
      ) : null}
      {expanded ? (
        <Pressable accessibilityRole="button" onPress={onDelete} style={({ pressed }) => [styles.deleteButton, pressed && styles.sessionPressed]}>
          <MaterialIcons color={forjaColors.danger} name="delete-outline" size={18} />
          <Text style={styles.deleteLabel}>Excluir sessão</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

function RouteDetail({ session }: { session: CardioSession }) {
  return (
    <View style={styles.detailWrap}>
      <SectionHeading eyebrow="Sessão selecionada" title="Rota e movimento" />
      <View style={styles.detailMap}>
        <LeafletMap route={session.route} />
      </View>
      <Card style={styles.detailCard}>
        <View style={styles.detailRow}>
          <MaterialIcons color={forjaColors.lime} name="directions-walk" size={21} />
          <View>
            <Text style={styles.detailTitle}>{session.steps.toLocaleString("pt-BR")} passos</Text>
            <Text style={styles.detailBody}>{session.stepSource === "sensor" ? "Registrados pelo sensor de movimento." : "Estimados a partir da distância percorrida."}</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

function EmptyHistory() {
  return (
    <Card style={styles.emptyCard}>
      <View style={styles.emptyIcon}><MaterialIcons color={forjaColors.lime} name="route" size={28} /></View>
      <Text style={styles.emptyTitle}>Seu histórico está pronto para começar.</Text>
      <Text style={styles.emptyText}>Quando você finalizar um cardio, a distância, o tempo, o ritmo, os passos e o trajeto aparecerão aqui.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34 },
  kicker: { color: forjaColors.lime, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  title: { color: forjaColors.text, fontSize: 28, fontWeight: "900", letterSpacing: -1, marginTop: 8 },
  subtitle: { color: forjaColors.muted, fontSize: 14, lineHeight: 20, marginTop: 7 },
  summaryCard: { marginTop: 22, paddingBottom: 17 },
  summaryRow: { alignItems: "stretch", flexDirection: "row" },
  metricDivider: { backgroundColor: forjaColors.border, width: 1 },
  listTitle: { color: forjaColors.text, fontSize: 17, fontWeight: "900", marginBottom: 12, marginTop: 26 },
  sessionCard: { marginBottom: 10, padding: 15 },
  sessionCardExpanded: { borderColor: "rgba(185, 242, 39, 0.45)" },
  sessionPressable: { alignItems: "center", flexDirection: "row", gap: 12 },
  sessionPressed: { opacity: 0.72 },
  sessionIcon: { alignItems: "center", backgroundColor: "rgba(185,242,39,0.12)", borderRadius: 13, height: 45, justifyContent: "center", width: 45 },
  sessionCopy: { flex: 1 },
  sessionTitle: { color: forjaColors.text, fontSize: 15, fontWeight: "900" },
  sessionDate: { color: forjaColors.muted, fontSize: 12, marginTop: 4 },
  sessionMetrics: { flexDirection: "row", justifyContent: "space-between", marginLeft: 57, marginTop: 16 },
  sessionMetricValue: { color: forjaColors.text, fontSize: 14, fontVariant: ["tabular-nums"], fontWeight: "900" },
  sessionMetricUnit: { color: forjaColors.muted, fontSize: 11 },
  sessionMetricLabel: { color: forjaColors.muted, fontSize: 10, fontWeight: "700", marginTop: 4 },
  deleteButton: { alignItems: "center", flexDirection: "row", gap: 7, marginLeft: 57, marginTop: 15 },
  selfieWrap: { marginLeft: 57, marginTop: 15 },
  selfieImage: { borderRadius: 16, height: 210, width: "100%" },
  selfieCaption: { color: forjaColors.muted, fontSize: 11, marginTop: 7 },
  deleteLabel: { color: forjaColors.danger, fontSize: 12, fontWeight: "800" },
  detailWrap: { marginTop: 22 },
  detailMap: { backgroundColor: forjaColors.map, borderColor: forjaColors.border, borderRadius: 20, borderWidth: 1, height: 230, overflow: "hidden" },
  detailCard: { marginTop: 12 },
  detailRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  detailTitle: { color: forjaColors.text, fontSize: 15, fontWeight: "900" },
  detailBody: { color: forjaColors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  emptyCard: { alignItems: "center", gap: 10, marginTop: 24, paddingVertical: 34 },
  emptyIcon: { alignItems: "center", backgroundColor: "rgba(185,242,39,0.12)", borderRadius: 20, height: 58, justifyContent: "center", width: 58 },
  emptyTitle: { color: forjaColors.text, fontSize: 16, fontWeight: "900", textAlign: "center" },
  emptyText: { color: forjaColors.muted, fontSize: 13, lineHeight: 19, textAlign: "center" },
});
