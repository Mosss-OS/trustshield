import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PlatformEnum = z.enum(["x", "instagram", "linkedin", "tiktok", "facebook", "youtube", "other"]);

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const OnboardingSchema = z.object({
  display_name: z.string().trim().min(1).max(100),
  industry: z.string().trim().min(1).max(100),
  goals: z.string().trim().min(1).max(1000),
  tone_voice: z.string().trim().min(1).max(500),
  handles: z
    .array(z.object({ platform: PlatformEnum, handle: z.string().trim().min(1).max(200) }))
    .max(20),
});

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => OnboardingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error: pErr } = await context.supabase
      .from("profiles")
      .upsert({
        id: context.userId,
        display_name: data.display_name,
        industry: data.industry,
        goals: data.goals,
        tone_voice: data.tone_voice,
        onboarding_complete: true,
      });
    if (pErr) throw new Error(pErr.message);

    // Replace handles
    await context.supabase.from("monitored_handles").delete().eq("user_id", context.userId);
    if (data.handles.length) {
      const rows = data.handles.map((h) => ({
        user_id: context.userId,
        platform: h.platform,
        handle: h.handle,
      }));
      const { error: hErr } = await context.supabase.from("monitored_handles").insert(rows);
      if (hErr) throw new Error(hErr.message);
    }
    return { ok: true };
  });
