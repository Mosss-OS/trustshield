import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getGateway } from "./ai-gateway.server";

const PlatformEnum = z.enum(["x", "instagram", "linkedin", "tiktok", "facebook", "youtube", "other"]);
const ContentTypeEnum = z.enum(["post", "caption", "script", "bio"]);
const ContentStatusEnum = z.enum(["draft", "scheduled", "published"]);

export const draftPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        topic: z.string().trim().min(1).max(500),
        platform: PlatformEnum,
        content_type: ContentTypeEnum.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("display_name, industry, tone_voice, goals")
      .eq("id", context.userId)
      .maybeSingle();

    const gateway = getGateway();
    const platform = data.platform;
    const contentType = data.content_type ?? "post";
    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        system: `You are a personal-brand writer for TrustShield users. Write authentic, on-brand content that reflects the user's tone and goals. Never fabricate credentials, statistics, or quotes. Keep it truthful and specific.`,
        prompt: `USER:
Name: ${profile?.display_name ?? "(not set)"}
Industry: ${profile?.industry ?? "(not set)"}
Goals: ${profile?.goals ?? "(not set)"}
Tone/voice: ${profile?.tone_voice ?? "professional and warm"}

PLATFORM: ${platform}
CONTENT TYPE: ${contentType}
TOPIC: ${data.topic}

Write ONE ${contentType} appropriate for ${platform}. Match the platform's typical length (short for X, medium for LinkedIn/Facebook, caption style for Instagram/TikTok, script format for YouTube). Return only the content text, no preamble.`,
      });
      return { draft: text };
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("429")) throw new Error("AI is rate-limited. Please retry in a moment.");
      if (msg.includes("402")) throw new Error("AI credits exhausted. Add credits in your workspace billing.");
      throw new Error(`Draft failed: ${msg}`);
    }
  });

export const saveBrandContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        platform: PlatformEnum,
        content_type: ContentTypeEnum,
        content_text: z.string().trim().min(1).max(8000),
        status: ContentStatusEnum.optional(),
        scheduled_at: z.string().datetime().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: item, error } = await context.supabase
      .from("brand_content")
      .insert({
        user_id: context.userId,
        platform: data.platform,
        content_type: data.content_type,
        content_text: data.content_text,
        status: data.status ?? "draft",
        scheduled_at: data.scheduled_at ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return item;
  });

export const listBrandContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: ContentStatusEnum.optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("brand_content")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (data.status) {
      query = query.eq("status", data.status);
    }

    const { data: items, error } = await query;
    if (error) throw new Error(error.message);
    return items;
  });

export const updateBrandContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        content_text: z.string().trim().min(1).max(8000).optional(),
        status: ContentStatusEnum.optional(),
        scheduled_at: z.string().datetime().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const updates: Record<string, unknown> = {};
    if (data.content_text !== undefined) updates.content_text = data.content_text;
    if (data.status !== undefined) updates.status = data.status;
    if (data.scheduled_at !== undefined) updates.scheduled_at = data.scheduled_at;
    updates.updated_at = new Date().toISOString();

    const { error } = await context.supabase
      .from("brand_content")
      .update(updates)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
  });

export const deleteBrandContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("brand_content")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
  });

export const computeBrandHealthScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Get active screening results
    const { data: screenings, error: sErr } = await context.supabase
      .from("screening_results")
      .select("severity, reviewed, dismissed")
      .eq("user_id", context.userId)
      .eq("dismissed", false);
    if (sErr) throw new Error(sErr.message);

    // Get brand content counts
    const { data: content, error: cErr } = await context.supabase
      .from("brand_content")
      .select("status")
      .eq("user_id", context.userId);
    if (cErr) throw new Error(cErr.message);

    // Compute score
    const severityWeights: Record<string, number> = { info: 0, low: 4, medium: 12, high: 25 };
    const penalty = screenings.reduce((s, r) => s + (severityWeights[r.severity] ?? 0), 0);
    const contentBonus = content.filter((c) => c.status === "published").length * 3;
    const score = Math.max(5, Math.min(100, 100 - penalty + contentBonus));

    const breakdown = {
      penalty,
      contentBonus,
      activeScreenings: screenings.length,
      publishedContent: content.filter((c) => c.status === "published").length,
      draftContent: content.filter((c) => c.status === "draft").length,
      scheduledContent: content.filter((c) => c.status === "scheduled").length,
    };

    // Store the score
    const { error: hErr } = await context.supabase.from("brand_health_scores").insert({
      user_id: context.userId,
      score,
      breakdown,
    });
    if (hErr) throw new Error(hErr.message);

    return { score, breakdown };
  });

export const getBrandHealthHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("brand_health_scores")
      .select("*")
      .eq("user_id", context.userId)
      .order("computed_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return data;
  });

export const getLatestBrandHealthScore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("brand_health_scores")
      .select("*")
      .eq("user_id", context.userId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });