export const CATEGORY_LABELS: Record<string, string> = {
  harmful_abusive: "Harmful / abusive",
  reputation_risk: "Reputation risk",
  legitimate_criticism: "Legitimate criticism",
  positive_on_brand: "Positive / on-brand",
  neutral: "Neutral",
  impersonation: "Impersonation / fake account",
};

export const ACTION_LABELS: Record<string, string> = {
  flag_for_removal: "Flag for removal",
  respond_with_context: "Respond with context",
  leave_alone: "Leave alone",
  amplify: "Amplify",
};

export const SEVERITY_LABELS: Record<string, string> = {
  info: "Info",
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const SEVERITY_CLASS: Record<string, string> = {
  info: "bg-muted text-muted-foreground border-border",
  low: "bg-[color-mix(in_oklch,var(--severity-low)_18%,transparent)] text-foreground border-[color-mix(in_oklch,var(--severity-low)_35%,transparent)]",
  medium:
    "bg-[color-mix(in_oklch,var(--severity-medium)_22%,transparent)] text-foreground border-[color-mix(in_oklch,var(--severity-medium)_40%,transparent)]",
  high: "bg-[color-mix(in_oklch,var(--severity-high)_20%,transparent)] text-foreground border-[color-mix(in_oklch,var(--severity-high)_50%,transparent)]",
};

export const PLATFORMS = [
  { value: "x", label: "X (Twitter)" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "other", label: "Other" },
] as const;
