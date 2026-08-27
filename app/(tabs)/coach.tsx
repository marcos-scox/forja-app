import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Card, forjaColors } from "@/components/forja-ui";
import { ScreenContainer } from "@/components/screen-container";
import { askCoach, AI_PROVIDER_LABEL } from "@/lib/forja/ai-coach";
import { createId } from "@/lib/forja/metrics";
import { useForja } from "@/lib/forja/forja-context";
import type { AiChatMessage } from "@/lib/forja/types";

const STARTER_MESSAGE: AiChatMessage = {
  id: "forja-coach-welcome",
  role: "assistant",
  content: "Olá. Posso ajudar a organizar uma corrida, caminhada ou treino de exercícios. Qual é o seu objetivo hoje?",
};

const QUICK_QUESTIONS = [
  "Como começo a correr?",
  "Monte uma caminhada de 30 min",
  "Como melhorar meu ritmo?",
];

export default function CoachScreen() {
  const { preferences, sessions } = useForja();
  const [messages, setMessages] = useState<AiChatMessage[]>([STARTER_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<AiChatMessage>>(null);

  useEffect(() => {
    const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [messages.length, sending]);

  async function sendQuestion(value = draft) {
    const question = value.trim();
    if (!question || sending) return;

    const userMessage: AiChatMessage = { id: createId("question"), role: "user", content: question };
    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setDraft("");
    setError(null);
    setSending(true);

    try {
      const answer = await askCoach({ preferences, messages: conversation, sessions });
      setMessages((current) => [...current, { id: createId("answer"), role: "assistant", content: answer }]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível responder agora. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardView}>
        <FlatList
          ref={listRef}
          contentContainerStyle={styles.content}
          data={messages}
          keyExtractor={(message) => message.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <>
              <Text style={styles.kicker}>IA COACH</Text>
              <Text style={styles.title}>Movimento com orientação.</Text>
              <Text style={styles.subtitle}>Pergunte sobre corrida, caminhada, mobilidade e treino. O coach usa <Text style={styles.providerName}>{AI_PROVIDER_LABEL[preferences.aiProvider]}</Text>.</Text>
              <View style={styles.quickRow}>
                {QUICK_QUESTIONS.map((question) => (
                  <Pressable key={question} accessibilityRole="button" disabled={sending} onPress={() => void sendQuestion(question)} style={({ pressed }) => [styles.quickButton, pressed && styles.quickButtonPressed, sending && styles.quickButtonDisabled]}>
                    <Text style={styles.quickText}>{question}</Text>
                  </Pressable>
                ))}
              </View>
              {error ? (
                <View style={styles.errorBox}>
                  <MaterialIcons color={forjaColors.warning} name="info-outline" size={19} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
            </>
          }
          ListFooterComponent={
            sending ? (
              <View style={[styles.bubble, styles.assistantBubble, styles.typingBubble]}>
                <ActivityIndicator color={forjaColors.lime} size="small" />
                <Text style={styles.typingText}>O coach está preparando a resposta…</Text>
              </View>
            ) : (
              <Card style={styles.safetyCard}>
                <MaterialIcons color={forjaColors.lime} name="health-and-safety" size={20} />
                <Text style={styles.safetyText}>As sugestões são educativas. Interrompa o exercício e procure atendimento se sentir dor aguda, dor no peito, desmaio ou falta de ar intensa.</Text>
              </Card>
            )
          }
          renderItem={({ item }) => <ChatBubble message={item} />}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Pergunta para o IA Coach"
            editable={!sending}
            multiline
            onChangeText={setDraft}
            onSubmitEditing={() => void sendQuestion()}
            placeholder="Ex.: Como preparo uma corrida de 5 km?"
            placeholderTextColor={forjaColors.muted}
            returnKeyType="send"
            style={styles.input}
            value={draft}
          />
          <Pressable accessibilityLabel="Enviar pergunta" accessibilityRole="button" disabled={!draft.trim() || sending} onPress={() => void sendQuestion()} style={({ pressed }) => [styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled, pressed && styles.sendButtonPressed]}>
            <MaterialIcons color={forjaColors.background} name="arrow-upward" size={22} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function ChatBubble({ message }: { message: AiChatMessage }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      <Text style={[styles.bubbleLabel, isUser && styles.userBubbleLabel]}>{isUser ? "Você" : "Forja Coach"}</Text>
      <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{message.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  kicker: { color: forjaColors.lime, fontSize: 11, fontWeight: "900", letterSpacing: 2 },
  title: { color: forjaColors.text, fontSize: 28, fontWeight: "900", letterSpacing: -1, lineHeight: 34, marginTop: 8 },
  subtitle: { color: forjaColors.muted, fontSize: 14, lineHeight: 20, marginTop: 7 },
  providerName: { color: forjaColors.lime, fontWeight: "800" },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12, marginTop: 18 },
  quickButton: { backgroundColor: "rgba(185, 242, 39, 0.10)", borderColor: "rgba(185, 242, 39, 0.35)", borderRadius: 99, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  quickButtonPressed: { opacity: 0.75 },
  quickButtonDisabled: { opacity: 0.45 },
  quickText: { color: forjaColors.lime, fontSize: 12, fontWeight: "800" },
  errorBox: { alignItems: "flex-start", backgroundColor: "rgba(255, 183, 74, 0.10)", borderColor: "rgba(255, 183, 74, 0.26)", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 13, padding: 12 },
  errorText: { color: forjaColors.warning, flex: 1, fontSize: 12, lineHeight: 18 },
  bubble: { borderRadius: 18, marginBottom: 10, maxWidth: "92%", padding: 14 },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: forjaColors.surface, borderColor: forjaColors.border, borderWidth: 1 },
  userBubble: { alignSelf: "flex-end", backgroundColor: forjaColors.lime },
  bubbleLabel: { color: forjaColors.lime, fontSize: 10, fontWeight: "900", letterSpacing: 0.8, marginBottom: 5, textTransform: "uppercase" },
  userBubbleLabel: { color: "rgba(10, 13, 12, 0.72)" },
  bubbleText: { color: forjaColors.text, fontSize: 14, lineHeight: 21 },
  userBubbleText: { color: forjaColors.background },
  typingBubble: { alignItems: "center", flexDirection: "row", gap: 10 },
  typingText: { color: forjaColors.muted, fontSize: 12, fontWeight: "700" },
  safetyCard: { alignItems: "flex-start", flexDirection: "row", gap: 10, marginTop: 10 },
  safetyText: { color: forjaColors.muted, flex: 1, fontSize: 12, lineHeight: 18 },
  composer: { alignItems: "flex-end", backgroundColor: forjaColors.surface, borderTopColor: forjaColors.border, borderTopWidth: 1, flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  input: { backgroundColor: forjaColors.surfaceElevated, borderColor: forjaColors.border, borderRadius: 17, borderWidth: 1, color: forjaColors.text, flex: 1, fontSize: 14, lineHeight: 19, maxHeight: 112, minHeight: 48, paddingHorizontal: 14, paddingVertical: 12 },
  sendButton: { alignItems: "center", backgroundColor: forjaColors.lime, borderRadius: 16, height: 48, justifyContent: "center", width: 48 },
  sendButtonDisabled: { opacity: 0.35 },
  sendButtonPressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
});
