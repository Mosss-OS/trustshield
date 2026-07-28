import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PreferencesSchema = z.object({
  email_high_severity: z.boolean(),
  email_medium_severity: z.boolean(),
  email_low_severity: z.boolean(),
  email_remediation_updates: z.boolean(),
  email_weekly_summary: z.boolean(),
  email_brand_health: z.boolean(),
});

export const getNotificationPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    // Return defaults if no preferences exist
    if (!data) {
      return {
        email_high_severity: true,
        email_medium_severity: true,
        email_low_severity: false,
        email_remediation_updates: true,
        email_weekly_summary: true,
        email_brand_health: false,
      };
    }
    return data;
  });

export const updateNotificationPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PreferencesSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("notification_preferences").upsert(
      {
        user_id: context.userId,
        ...data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
  });