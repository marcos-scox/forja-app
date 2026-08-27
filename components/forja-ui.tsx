import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

export const forjaColors = {
  background: "#0A0D0C",
  surface: "#151A17",
  surfaceElevated: "#202722",
  lime: "#B9F227",
  text: "#F4F7F2",
  muted: "#9AA59C",
  border: "#2D352F",
  warning: "#FFB74A",
  danger: "#FF6B6B",
  map: "#111713",
} as const;

type IconName = ComponentProps<typeof MaterialIcons>["name"];

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionHeadingText}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function Metric({ label, value, suffix, accent = false }: { label: string; value: string; suffix?: string; accent?: boolean }) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, accent && styles.metricValueAccent]} numberOfLines={1}>
        {value}
        {suffix ? <Text style={styles.metricSuffix}> {suffix}</Text> : null}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function PrimaryButton({
  title,
  icon,
  onPress,
  disabled = false,
  variant = "primary",
}: {
  title: string;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const variantStyle = variant === "primary" ? styles.primaryButton : variant === "danger" ? styles.dangerButton : styles.secondaryButton;
  const labelStyle = variant === "primary" ? styles.primaryButtonLabel : variant === "danger" ? styles.dangerButtonLabel : styles.secondaryButtonLabel;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, variantStyle, disabled && styles.buttonDisabled, pressed && !disabled && styles.buttonPressed]}
    >
      {icon ? <MaterialIcons color={variant === "primary" ? forjaColors.background : variant === "danger" ? forjaColors.danger : forjaColors.lime} name={icon} size={20} /> : null}
      <Text style={labelStyle}>{title}</Text>
    </Pressable>
  );
}

export function StatusChip({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "active" | "warning" }) {
  const toneStyle = tone === "active" ? styles.chipActive : tone === "warning" ? styles.chipWarning : styles.chipNeutral;
  const textStyle = tone === "active" ? styles.chipTextActive : tone === "warning" ? styles.chipTextWarning : styles.chipTextNeutral;
  return (
    <View style={[styles.chip, toneStyle]}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: forjaColors.surface,
    borderColor: forjaColors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
  },
  sectionHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  sectionHeadingText: { flex: 1 },
  eyebrow: { color: forjaColors.lime, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 4, textTransform: "uppercase" },
  sectionTitle: { color: forjaColors.text, fontSize: 19, fontWeight: "800", letterSpacing: -0.25 },
  metric: { alignItems: "center", flex: 1, gap: 5 },
  metricValue: { color: forjaColors.text, fontSize: 25, fontVariant: ["tabular-nums"], fontWeight: "800", letterSpacing: -0.8 },
  metricValueAccent: { color: forjaColors.lime },
  metricSuffix: { color: forjaColors.muted, fontSize: 12, fontWeight: "700" },
  metricLabel: { color: forjaColors.muted, fontSize: 11, fontWeight: "600" },
  button: { alignItems: "center", borderRadius: 16, flexDirection: "row", gap: 9, justifyContent: "center", minHeight: 52, paddingHorizontal: 18 },
  primaryButton: { backgroundColor: forjaColors.lime },
  secondaryButton: { backgroundColor: forjaColors.surfaceElevated, borderColor: forjaColors.border, borderWidth: 1 },
  dangerButton: { backgroundColor: "rgba(255, 107, 107, 0.10)", borderColor: "rgba(255, 107, 107, 0.35)", borderWidth: 1 },
  primaryButtonLabel: { color: forjaColors.background, fontSize: 15, fontWeight: "800" },
  secondaryButtonLabel: { color: forjaColors.text, fontSize: 15, fontWeight: "800" },
  dangerButtonLabel: { color: forjaColors.danger, fontSize: 15, fontWeight: "800" },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  chip: { alignItems: "center", borderRadius: 999, flexDirection: "row", justifyContent: "center", paddingHorizontal: 10, paddingVertical: 6 },
  chipNeutral: { backgroundColor: forjaColors.surfaceElevated },
  chipActive: { backgroundColor: "rgba(185, 242, 39, 0.14)" },
  chipWarning: { backgroundColor: "rgba(255, 183, 74, 0.14)" },
  chipTextNeutral: { color: forjaColors.muted, fontSize: 11, fontWeight: "700" },
  chipTextActive: { color: forjaColors.lime, fontSize: 11, fontWeight: "800" },
  chipTextWarning: { color: forjaColors.warning, fontSize: 11, fontWeight: "800" },
});
