import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card, SectionHeading, forjaColors } from "@/components/forja-ui";
import { ScreenContainer } from "@/components/screen-container";
import { formatDistance, formatDuration } from "@/lib/forja/metrics";
import { useForja } from "@/lib/forja/forja-context";

type CoachTopic = "preparacao" | "recuperacao" | "progresso";

export default function CoachScreen() {
  const { sessions } = useForja();
  const [topic, setTopic] = useState<CoachTopic>("preparacao");
  const sessionDistance = sessions.reduce((sum, session) => sum + session.distanceM, 0);
  const sessionDuration = sessions.reduce((sum, session) => sum + session.durationMs, 0);
  const response = useMemo(() => {
    if (topic === "recuperacao") {
      return "Após um cardio, priorize hidratação, uma refeição com proteína e carboidrato e uma caminhada leve. Se houver dor aguda ou persistente, interrompa o treino e procure avaliação profissional.";
    }
    if (topic === "progresso") {
      if (!sessions.length) {
        return "Seu histórico ainda está vazio. Registre uma primeira sessão de cardio para que o Forja acompanhe distância, duração, ritmo e passos com dados do seu aparelho.";
      }
      return `Você registrou ${sessions.length} sessão${sessions.length === 1 ? "" : "ões"}, somando ${formatDistance(sessionDistance)} km em ${formatDuration(sessionDuration)}. Busque consistência antes de elevar volume ou intensidade.`;
    }
    return "Comece em um ritmo em que seja possível falar frases curtas. Aguarde a localização ficar precisa, aqueça por alguns minutos e mantenha o celular fixo ao corpo para melhorar o registro de GPS e passos.";
  }, [sessionDistance, sessionDuration, sessions.length, topic]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>IA COACH</Text>
        <Text style={styles.title}>Orientação para o próximo passo.</Text>
        <Text style={styles.subtitle}>Sugestões diretas a partir do que está registrado no seu dispositivo.</Text>

        <Card style={styles.coachCard}>
          <View style={styles.iconCircle}>
            <MaterialIcons color={forjaColors.background} name="auto-awesome" size={25} />
          </View>
          <Text style={styles.coachGreeting}>Como posso ajudar hoje?</Text>
          <Text style={styles.coachResponse}>{response}</Text>
        </Card>

        <View style={styles.gap} />
        <SectionHeading eyebrow="Pergunte ao coach" title="Foco da sessão" />
        <View style={styles.topicGrid}>
          <CoachButton active={topic === "preparacao"} icon="directions-run" label="Como começar" onPress={() => setTopic("preparacao")} />
          <CoachButton active={topic === "recuperacao"} icon="self-improvement" label="Recuperar melhor" onPress={() => setTopic("recuperacao")} />
          <CoachButton active={topic === "progresso"} icon="insights" label="Meu progresso" onPress={() => setTopic("progresso")} />
        </View>

        <View style={styles.gap} />
        <Card>
          <Text style={styles.noteTitle}>Privacidade primeiro</Text>
          <Text style={styles.noteBody}>As métricas usadas nesta primeira versão ficam armazenadas localmente. Nenhuma conta é necessária para registrar os seus treinos.</Text>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

function CoachButton({ active, icon, label, onPress }: { active: boolean; icon: "directions-run" | "self-improvement" | "insights"; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.topicButton, active && styles.topicButtonActive, pressed && styles.topicButtonPressed]}>
      <MaterialIcons color={active ? forjaColors.background : forjaColors.lime} name={icon} size={22} />
      <Text style={[styles.topicLabel, active && styles.topicLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34 },
  kicker: { color: forjaColors.lime, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  title: { color: forjaColors.text, fontSize: 28, fontWeight: "900", letterSpacing: -1, lineHeight: 33, marginTop: 8 },
  subtitle: { color: forjaColors.muted, fontSize: 14, lineHeight: 20, marginTop: 7 },
  coachCard: { alignItems: "flex-start", gap: 13, marginTop: 24 },
  iconCircle: { alignItems: "center", backgroundColor: forjaColors.lime, borderRadius: 15, height: 48, justifyContent: "center", width: 48 },
  coachGreeting: { color: forjaColors.text, fontSize: 19, fontWeight: "900" },
  coachResponse: { color: forjaColors.muted, fontSize: 14, lineHeight: 22 },
  gap: { height: 24 },
  topicGrid: { gap: 10 },
  topicButton: { alignItems: "center", backgroundColor: forjaColors.surface, borderColor: forjaColors.border, borderRadius: 17, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 57, paddingHorizontal: 16 },
  topicButtonActive: { backgroundColor: forjaColors.lime, borderColor: forjaColors.lime },
  topicButtonPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  topicLabel: { color: forjaColors.text, fontSize: 15, fontWeight: "800" },
  topicLabelActive: { color: forjaColors.background },
  noteTitle: { color: forjaColors.text, fontSize: 15, fontWeight: "900", marginBottom: 7 },
  noteBody: { color: forjaColors.muted, fontSize: 13, lineHeight: 20 },
});
