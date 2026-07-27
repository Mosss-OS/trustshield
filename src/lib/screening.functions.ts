import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getGateway } from "./ai-gateway.server";

const PlatformEnum = z.enum(["x", "instagram", "linkedin", "tiktok", "facebook", "youtube", "other"]);

const CategoryEnum = z.enum([
  "harmful_abusive",
  "reputation_risk",
  "legitimate_criticism",
  "positive_on_brand",
  "neutral",
  "impersonation",
]);
const SeverityEnum = z.enum(["info", "low", "medium", "high"]);
const ActionEnum = z.enum(["flag_for_removal", "respond_with_context", "leave_alone", "amplify"]);

const AnalysisSchema = z.object({
  category: CategoryEnum,
  severity: SeverityEnum,
  rationale: z.string().min(1).max(600),
  suggested_action: ActionEnum,
  suggested_response: z.string().max(800).optional(),
});

const SYSTEM_PROMPT = `You are TrustShield, an AI reputation analyst. You classify a piece of online content that a user (or someone talking about them) has posted, and suggest a policy-compliant action.

CATEGORIES:
- harmful_abusive: hate speech, harassment, explicit content, doxxing/PII leaks, threats, extremism.
- reputation_risk: content by the user that is unprofessional, controversial, or a PR liability but not abusive.
- legitimate_criticism: factual, newsworthy, or public-record criticism of the user. This includes fair reporting, factual complaints, or matters of public interest.
- positive_on_brand: helpful or positive content aligned with the user's brand.
- neutral: informational or non-notable content.
- impersonation: fake accounts or AI-generated content impersonating the user (same name/photo, different handle; deepfake content claiming to be the user).

SUGGESTED ACTIONS — pick exactly one, with these HARD RULES:
- flag_for_removal — ONLY for harmful_abusive content, impersonation, or content that is provably false and defamatory. Never for content that is true, newsworthy, or a matter of public record.
- respond_with_context — for legitimate_criticism or ambiguous reputation_risk items. When you use this, ALSO provide a short, professional draft response in suggested_response.
- leave_alone — for content that is true, newsworthy, public-record, or simply neutral. Never suggest hiding or burying such content.
- amplify — for positive_on_brand content the user could share more widely.

CORE PRINCIPLE — NON-NEGOTIABLE: You must never suggest suppressing, hiding, or removing content that is true, newsworthy, or a matter of public record, even if it is unflattering. For such content the correct action is respond_with_context or leave_alone.

Return ONLY structured output matching the schema. Keep the rationale plain-language, one to three sentences, explaining WHY.`;

export const analyzeContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        content: z.string().trim().min(1).max(8000),
        platform: PlatformEnum.optional(),
        source_url: z.string().url().max(2000).optional().or(z.literal("")),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Persist raw content
    const { data: item, error: iErr } = await context.supabase
      .from("content_items")
      .insert({
        user_id: context.userId,
        platform: data.platform ?? null,
        source_url: data.source_url || null,
        content: data.content,
      })
      .select()
      .single();
    if (iErr) throw new Error(iErr.message);

    // Get user context for tone
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("display_name, industry, tone_voice, goals")
      .eq("id", context.userId)
      .maybeSingle();

    const gateway = getGateway();
    let result;
    try {
      result = await generateObject({
        model: gateway("google/gemini-3.6-flash"),
        schema: AnalysisSchema,
        system: SYSTEM_PROMPT,
        prompt: `USER CONTEXT:
Name: ${profile?.display_name ?? "(not set)"}
Industry: ${profile?.industry ?? "(not set)"}
Goals: ${profile?.goals ?? "(not set)"}
Preferred tone/voice: ${profile?.tone_voice ?? "(not set)"}

CONTENT TO ANALYZE${data.platform ? ` (from ${data.platform})` : ""}:
"""
${data.content}
"""`,
      });
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("429")) throw new Error("AI is rate-limited. Please retry in a moment.");
      if (msg.includes("402"))
        throw new Error("AI credits exhausted. Add credits in your workspace billing.");
      throw new Error(`AI analysis failed: ${msg}`);
    }

    const analysis = result.object;

    // Enforce policy server-side: no flag_for_removal for legitimate_criticism
    if (
      analysis.suggested_action === "flag_for_removal" &&
      (analysis.category === "legitimate_criticism" || analysis.category === "neutral")
    ) {
      analysis.suggested_action = "respond_with_context";
    }

    const { data: res, error: rErr } = await context.supabase
      .from("screening_results")
      .insert({
        user_id: context.userId,
        content_item_id: item.id,
        category: analysis.category,
        severity: analysis.severity,
        rationale: analysis.rationale,
        suggested_action: analysis.suggested_action,
        suggested_response: analysis.suggested_response ?? null,
      })
      .select()
      .single();
    if (rErr) throw new Error(rErr.message);

    // Auto-create alert for high/critical severity findings
    if (analysis.severity === "high" || analysis.severity === "medium") {
      const severityLabel = analysis.severity === "high" ? "High" : "Medium";
      const categoryLabel = analysis.category.replace(/_/g, " ");
      await context.supabase.from("alerts").insert({
        user_id: context.userId,
        message: `${severityLabel}-severity ${categoryLabel} content detected. Review recommended.`,
        alert_type: "new_mention",
        related_scan_result_id: res.id,
      });
    }

    return { item, result: res };
  });
