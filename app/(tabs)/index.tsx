import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, type Href } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card, Metric, SectionHeading, forjaColors } from "@/components/forja-ui";
import { ScreenContainer } from "@/components/screen-container";
import { formatDistance, formatDuration } from "@/lib/forja/metrics";
import { useForja } from "@/lib/forja/forja-context";

export default function TrainingScreen() {
  const { hydrated, sessions } = useForja();
  const totalDistance = sessions.reduce((sum, session) => sum + session.distanceM, 0);
  const totalDuration = sessions.reduce((sum, session) => sum + session.durationMs, 0);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>FORJA</Text>
            <Text style={styles.title}>Treine com intenção.</Text>
            <Text style={styles.subtitle}>O progresso se constrói uma sessão por vez.</Text>
          </View>
          <View style={styles.brandMark}>
            <MaterialIcons color={forjaColors.background} name="bolt" size={24} />
          </View>
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
        <Card style={styles.cardioCallout}>
          <View style={styles.cardioIcon}>
            <MaterialIcons color={forjaColors.background} name="directions-run" size={25} />
          </View>
          <View style={styles.cardioCopy}>
            <Text style={styles.cardioTitle}>Cardio com GPS</Text>
            <Text style={styles.cardioBody}>Acompanhe mapa, distância, tempo, ritmo e passos em tempo real.</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push("/cardio" as Href)} style={({ pressed }) => [styles.arrowButton, pressed && styles.arrowButtonPressed]}>
            <MaterialIcons color={forjaColors.background} name="arrow-forward" size={21} />
          </Pressable>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
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
  cardioCallout: { alignItems: "center", backgroundColor: forjaColors.surfaceElevated, flexDirection: "row", gap: 13 },
  cardioIcon: { alignItems: "center", backgroundColor: forjaColors.lime, borderRadius: 14, height: 49, justifyContent: "center", width: 49 },
  cardioCopy: { flex: 1 },
  cardioTitle: { color: forjaColors.text, fontSize: 16, fontWeight: "900" },
  cardioBody: { color: forjaColors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  arrowButton: { alignItems: "center", backgroundColor: forjaColors.lime, borderRadius: 14, height: 44, justifyContent: "center", width: 44 },
  arrowButtonPressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
});
