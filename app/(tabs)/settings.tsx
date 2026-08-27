import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Card, SectionHeading, forjaColors } from "@/components/forja-ui";
import { ScreenContainer } from "@/components/screen-container";
import { AI_PROVIDER_LABEL, DEFAULT_AI_MODEL } from "@/lib/forja/ai-coach";
import { readAiApiKey, removeAiApiKey, saveAiApiKey } from "@/lib/forja/ai-storage";
import { useForja } from "@/lib/forja/forja-context";
import type { AIProvider } from "@/lib/forja/types";

const PROVIDERS: { id: AIProvider; icon: "auto-awesome" | "smart-toy" | "bolt" | "psychology" | "chat-bubble" }[] = [
  { id: "manus", icon: "auto-awesome" },
  { id: "openai", icon: "smart-toy" },
  { id: "groq", icon: "bolt" },
  { id: "gemini", icon: "psychology" },
  { id: "claude", icon: "chat-bubble" },
];

export default function SettingsScreen() {
  const { preferences, sessions, updatePreferences, clearSessions } = useForja();
  const [stepLength, setStepLength] = useState(String(preferences.stepLengthM).replace(".", ","));
  const [apiKey, setApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [model, setModel] = useState(preferences.aiModel);

  useEffect(() => {
    setStepLength(String(preferences.stepLengthM).replace(".", ","));
  }, [preferences.stepLengthM]);

  useEffect(() => {
    setModel(preferences.aiModel);
  }, [preferences.aiModel]);

  useEffect(() => {
    let mounted = true;
    void readAiApiKey(preferences.aiProvider).then((value) => {
      if (!mounted) return;
      setApiKey("");
      setKeySaved(Boolean(value));
    });
    return () => {
      mounted = false;
    };
  }, [preferences.aiProvider]);

  function saveStepLength() {
    const value = Number(stepLength.replace(",", "."));
    if (Number.isFinite(value) && value >= 0.4 && value <= 1.4) {
      void updatePreferences({ stepLengthM: value });
      return;
    }
    setStepLength(String(preferences.stepLengthM).replace(".", ","));
    Alert.alert("Valor inválido", "Informe um comprimento de passo entre 0,40 m e 1,40 m.");
  }

  async function selectProvider(provider: AIProvider) {
    setApiKey("");
    setKeySaved(false);
    await updatePreferences({ aiProvider: provider, aiModel: DEFAULT_AI_MODEL[provider] });
  }

  async function saveAiConfig() {
    const cleanModel = model.trim() || DEFAULT_AI_MODEL[preferences.aiProvider];
    try {
      if (apiKey.trim()) await saveAiApiKey(preferences.aiProvider, apiKey);
      await updatePreferences({ aiModel: cleanModel });
      setApiKey("");
      setKeySaved(true);
      Alert.alert("IA Coach configurado", `O Forja usará ${AI_PROVIDER_LABEL[preferences.aiProvider]} no próximo chat.`);
    } catch {
      Alert.alert("Não foi possível salvar", "Confira a chave e tente novamente.");
    }
  }

  function confirmRemoveKey() {
    Alert.alert("Remover chave de API", `A chave de ${AI_PROVIDER_LABEL[preferences.aiProvider]} será removida deste aparelho.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => void removeAiApiKey(preferences.aiProvider).then(() => { setApiKey(""); setKeySaved(false); }) },
    ]);
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
        <Text style={styles.subtitle}>Controle suas métricas, os dados locais e o provedor do IA Coach.</Text>

        <View style={styles.gap} />
        <SectionHeading eyebrow="IA Coach" title="Provedor e chave de API" />
        <Card style={styles.aiCard}>
          <Text style={styles.settingBody}>Escolha onde as respostas serão geradas. A chave fica guardada somente neste aparelho e é enviada apenas ao provedor escolhido.</Text>
          <View style={styles.providerGrid}>
            {PROVIDERS.map((provider) => {
              const active = provider.id === preferences.aiProvider;
              return (
                <Pressable key={provider.id} accessibilityRole="button" onPress={() => void selectProvider(provider.id)} style={({ pressed }) => [styles.providerButton, active && styles.providerButtonActive, pressed && styles.providerButtonPressed]}>
                  <MaterialIcons color={active ? forjaColors.background : forjaColors.lime} name={provider.icon} size={19} />
                  <Text style={[styles.providerText, active && styles.providerTextActive]}>{AI_PROVIDER_LABEL[provider.id]}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldHeader}>
            <Text style={styles.settingTitle}>Chave de API de {AI_PROVIDER_LABEL[preferences.aiProvider]}</Text>
            {keySaved ? <Text style={styles.savedTag}>CHAVE SALVA</Text> : null}
          </View>
          <View style={styles.keyRow}>
            <TextInput accessibilityLabel="Chave da API de IA" autoCapitalize="none" autoCorrect={false} onChangeText={setApiKey} placeholder={keySaved ? "Digite uma nova chave para substituir" : "Cole a sua chave de API"} placeholderTextColor={forjaColors.muted} secureTextEntry={!showApiKey} style={styles.keyInput} value={apiKey} />
            <Pressable accessibilityLabel={showApiKey ? "Ocultar chave" : "Mostrar chave"} accessibilityRole="button" onPress={() => setShowApiKey((current) => !current)} style={({ pressed }) => [styles.eyeButton, pressed && styles.eyeButtonPressed]}>
              <MaterialIcons color={forjaColors.muted} name={showApiKey ? "visibility-off" : "visibility"} size={20} />
            </Pressable>
          </View>
          <Text style={styles.fieldLabel}>Modelo</Text>
          <TextInput accessibilityLabel="Modelo de IA" autoCapitalize="none" autoCorrect={false} onChangeText={setModel} placeholder={DEFAULT_AI_MODEL[preferences.aiProvider]} placeholderTextColor={forjaColors.muted} style={styles.modelInput} value={model} />
          <Pressable accessibilityRole="button" onPress={() => void saveAiConfig()} style={({ pressed }) => [styles.saveAiButton, pressed && styles.saveAiButtonPressed]}>
            <MaterialIcons color={forjaColors.background} name="lock" size={18} />
            <Text style={styles.saveAiText}>Salvar configuração de IA</Text>
          </Pressable>
          {keySaved ? <Pressable accessibilityRole="button" onPress={confirmRemoveKey} style={({ pressed }) => [styles.removeKeyButton, pressed && styles.removeKeyPressed]}><Text style={styles.removeKeyText}>Remover chave deste aparelho</Text></Pressable> : null}
        </Card>

        <View style={styles.gap} />
        <SectionHeading eyebrow="Cardio" title="Métricas de movimento" />
        <Card style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Usar pedômetro do aparelho</Text>
              <Text style={styles.settingBody}>Prioriza o sensor nativo de passos. Quando indisponível, o Forja estima por distância.</Text>
            </View>
            <Switch accessibilityLabel="Usar pedômetro do aparelho" onValueChange={(value) => void updatePreferences({ usePedometer: value })} thumbColor={preferences.usePedometer ? forjaColors.background : forjaColors.muted} trackColor={{ false: forjaColors.border, true: forjaColors.lime }} value={preferences.usePedometer} />
          </View>
          <View style={styles.divider} />
          <View style={styles.stepRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Comprimento médio do passo</Text>
              <Text style={styles.settingBody}>Usado somente na estimativa sem pedômetro.</Text>
            </View>
            <View style={styles.stepInputWrap}>
              <TextInput accessibilityLabel="Comprimento médio do passo em metros" keyboardType="decimal-pad" onBlur={saveStepLength} onChangeText={setStepLength} returnKeyType="done" style={styles.stepInput} value={stepLength} />
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
  aiCard: { gap: 14 },
  settingsCard: { gap: 16 },
  providerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  providerButton: { alignItems: "center", backgroundColor: forjaColors.surfaceElevated, borderColor: forjaColors.border, borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 7, minHeight: 40, paddingHorizontal: 10 },
  providerButtonActive: { backgroundColor: forjaColors.lime, borderColor: forjaColors.lime },
  providerButtonPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  providerText: { color: forjaColors.text, fontSize: 12, fontWeight: "800" },
  providerTextActive: { color: forjaColors.background },
  settingRow: { alignItems: "center", flexDirection: "row", gap: 18 },
  stepRow: { alignItems: "center", flexDirection: "row", gap: 12 },
  settingCopy: { flex: 1 },
  settingTitle: { color: forjaColors.text, fontSize: 15, fontWeight: "800" },
  settingBody: { color: forjaColors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  divider: { backgroundColor: forjaColors.border, height: 1 },
  fieldHeader: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  savedTag: { color: forjaColors.lime, fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  keyRow: { alignItems: "center", backgroundColor: forjaColors.surfaceElevated, borderColor: forjaColors.border, borderRadius: 13, borderWidth: 1, flexDirection: "row", minHeight: 48, paddingLeft: 12 },
  keyInput: { color: forjaColors.text, flex: 1, fontSize: 13, paddingVertical: 12 },
  eyeButton: { alignItems: "center", height: 46, justifyContent: "center", width: 45 },
  eyeButtonPressed: { opacity: 0.65 },
  fieldLabel: { color: forjaColors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.5, marginBottom: -7, textTransform: "uppercase" },
  modelInput: { backgroundColor: forjaColors.surfaceElevated, borderColor: forjaColors.border, borderRadius: 13, borderWidth: 1, color: forjaColors.text, fontSize: 13, minHeight: 48, paddingHorizontal: 12, paddingVertical: 12 },
  saveAiButton: { alignItems: "center", backgroundColor: forjaColors.lime, borderRadius: 14, flexDirection: "row", gap: 9, justifyContent: "center", minHeight: 48, paddingHorizontal: 14 },
  saveAiButtonPressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  saveAiText: { color: forjaColors.background, fontSize: 14, fontWeight: "900" },
  removeKeyButton: { alignSelf: "flex-start", paddingVertical: 4 },
  removeKeyPressed: { opacity: 0.7 },
  removeKeyText: { color: forjaColors.danger, fontSize: 12, fontWeight: "800" },
  stepInputWrap: { alignItems: "center", backgroundColor: forjaColors.surfaceElevated, borderColor: forjaColors.border, borderRadius: 13, borderWidth: 1, flexDirection: "row", height: 45, paddingHorizontal: 10, width: 87 },
  stepInput: { color: forjaColors.text, flex: 1, fontSize: 15, fontVariant: ["tabular-nums"], fontWeight: "800", padding: 0, textAlign: "right" },
  stepUnit: { color: forjaColors.muted, fontSize: 12, fontWeight: "700", marginLeft: 3 },
  storageIntro: { alignItems: "center", flexDirection: "row", gap: 13 },
  deleteRow: { alignItems: "center", flexDirection: "row", gap: 13 },
  deleteRowPressed: { opacity: 0.75 },
  deleteTitle: { color: forjaColors.danger, fontSize: 15, fontWeight: "800" },
});
