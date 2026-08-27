import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { Card, SectionHeading, forjaColors } from "@/components/forja-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useForja } from "@/lib/forja/forja-context";

export default function SettingsScreen() {
  const { preferences, sessions, updatePreferences, clearSessions } = useForja();
  const [stepLength, setStepLength] = useState(String(preferences.stepLengthM).replace(".", ","));

  useEffect(() => {
    setStepLength(String(preferences.stepLengthM).replace(".", ","));
  }, [preferences.stepLengthM]);

  function saveStepLength() {
    const value = Number(stepLength.replace(",", "."));
    if (Number.isFinite(value) && value >= 0.4 && value <= 1.4) {
      void updatePreferences({ stepLengthM: value });
      return;
    }
    setStepLength(String(preferences.stepLengthM).replace(".", ","));
    Alert.alert("Valor inválido", "Informe um comprimento de passo entre 0,40 m e 1,40 m.");
  }

  function confirmClearHistory() {
    Alert.alert("Apagar histórico", "Isso removerá as sessões de cardio armazenadas neste aparelho. Esta ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Apagar", style: "destructive", onPress: () => void clearSessions() },
    ]);
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>AJUSTES</Text>
        <Text style={styles.title}>Seu Forja, do seu jeito.</Text>
        <Text style={styles.subtitle}>Controle como o aplicativo calcula e armazena suas métricas.</Text>

        <View style={styles.gap} />
        <SectionHeading eyebrow="Cardio" title="Métricas de movimento" />
        <Card style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Usar pedômetro do aparelho</Text>
              <Text style={styles.settingBody}>Prioriza o sensor nativo de passos. Quando indisponível, o Forja estima por distância.</Text>
            </View>
            <Switch
              accessibilityLabel="Usar pedômetro do aparelho"
              onValueChange={(value) => void updatePreferences({ usePedometer: value })}
              thumbColor={preferences.usePedometer ? forjaColors.background : forjaColors.muted}
              trackColor={{ false: forjaColors.border, true: forjaColors.lime }}
              value={preferences.usePedometer}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.stepRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Comprimento médio do passo</Text>
              <Text style={styles.settingBody}>Usado apenas na estimativa sem pedômetro.</Text>
            </View>
            <View style={styles.stepInputWrap}>
              <TextInput
                accessibilityLabel="Comprimento médio do passo em metros"
                keyboardType="decimal-pad"
                onBlur={saveStepLength}
                onChangeText={setStepLength}
                returnKeyType="done"
                style={styles.stepInput}
                value={stepLength}
              />
              <Text style={styles.stepUnit}>m</Text>
            </View>
          </View>
        </Card>

        <View style={styles.gap} />
        <SectionHeading eyebrow="Dados" title="Privacidade e armazenamento" />
        <Card>
          <View style={styles.storageIntro}>
            <MaterialIcons color={forjaColors.lime} name="phonelink-lock" size={23} />
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Dados no dispositivo</Text>
              <Text style={styles.settingBody}>{sessions.length} sessão{sessions.length === 1 ? "" : "ões"} guardada{sessions.length === 1 ? "" : "s"} localmente.</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Pressable accessibilityRole="button" onPress={confirmClearHistory} style={({ pressed }) => [styles.deleteRow, pressed && styles.deleteRowPressed]}>
            <MaterialIcons color={forjaColors.danger} name="delete-outline" size={21} />
            <View style={styles.settingCopy}>
              <Text style={styles.deleteTitle}>Apagar histórico de cardio</Text>
              <Text style={styles.settingBody}>Remove rotas e métricas salvas deste aparelho.</Text>
            </View>
          </Pressable>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 34 },
  kicker: { color: forjaColors.lime, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  title: { color: forjaColors.text, fontSize: 28, fontWeight: "900", letterSpacing: -1, marginTop: 8 },
  subtitle: { color: forjaColors.muted, fontSize: 14, lineHeight: 20, marginTop: 7 },
  gap: { height: 24 },
  settingsCard: { gap: 16 },
  settingRow: { alignItems: "center", flexDirection: "row", gap: 18 },
  stepRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  settingCopy: { flex: 1 },
  settingTitle: { color: forjaColors.text, fontSize: 15, fontWeight: "800" },
  settingBody: { color: forjaColors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  divider: { backgroundColor: forjaColors.border, height: 1 },
  stepInputWrap: { alignItems: "center", backgroundColor: forjaColors.surfaceElevated, borderColor: forjaColors.border, borderRadius: 13, borderWidth: 1, flexDirection: "row", height: 45, paddingHorizontal: 10, width: 87 },
  stepInput: { color: forjaColors.text, flex: 1, fontSize: 15, fontVariant: ["tabular-nums"], fontWeight: "800", padding: 0, textAlign: "right" },
  stepUnit: { color: forjaColors.muted, fontSize: 12, fontWeight: "700", marginLeft: 3 },
  storageIntro: { alignItems: "center", flexDirection: "row", gap: 13 },
  deleteRow: { alignItems: "center", flexDirection: "row", gap: 13 },
  deleteRowPressed: { opacity: 0.75 },
  deleteTitle: { color: forjaColors.danger, fontSize: 15, fontWeight: "800" },
});
