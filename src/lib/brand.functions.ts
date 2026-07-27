import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getGateway } from "./ai-gateway.server";

export const draftPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        topic: z.string().trim().min(1).max(500),
        platform: z.enum(["x", "instagram", "linkedin", "tiktok", "facebook", "youtube", "other"]),
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
    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        system: `You are a personal-brand writer for TrustShield users. Write authentic, on-brand posts that reflect the user's tone and goals. Never fabricate credentials, statistics, or quotes. Keep it truthful and specific.`,
        prompt: `USER:
Name: ${profile?.display_name ?? "(not set)"}
Industry: ${profile?.industry ?? "(not set)"}
Goals: ${profile?.goals ?? "(not set)"}
Tone/voice: ${profile?.tone_voice ?? "professional and warm"}

PLATFORM: ${data.platform}
TOPIC: ${data.topic}

Write ONE post appropriate for ${data.platform}. Match the platform's typical length (short for X, medium for LinkedIn/Facebook, caption style for Instagram/TikTok). Return only the post text, no preamble.`,
      });
      return { draft: text };
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("429")) throw new Error("AI is rate-limited. Please retry in a moment.");
      if (msg.includes("402"))
        throw new Error("AI credits exhausted. Add credits in your workspace billing.");
      throw new Error(`Draft failed: ${msg}`);
    }
  });
