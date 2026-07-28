import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const logAuditEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        action: z.string().min(1).max(100),
        entity_type: z.string().min(1).max(100),
        entity_id: z.string().uuid().optional().nullable(),
        details: z.record(z.unknown()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("audit_log").insert({
      user_id: context.userId,
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id ?? null,
      details: data.details ?? {},
    });
    if (error) throw new Error(error.message);
  });

export const getAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("audit_log")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data;
  });

export const exportUserData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profileRes, handlesRes, contentRes, screeningsRes, alertsRes, brandContentRes, auditRes] =
      await Promise.all([
        context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
        context.supabase.from("monitored_handles").select("*").eq("user_id", context.userId),
        context.supabase.from("content_items").select("*").eq("user_id", context.userId),
        context.supabase
          .from("screening_results")
          .select("*, content_items(*)")
          .eq("user_id", context.userId),
        context.supabase.from("alerts").select("*").eq("user_id", context.userId),
        context.supabase.from("brand_content").select("*").eq("user_id", context.userId),
        context.supabase.from("audit_log").select("*").eq("user_id", context.userId),
      ]);

    return {
      exported_at: new Date().toISOString(),
      profile: profileRes.data,
      monitored_handles: handlesRes.data,
      content_items: contentRes.data,
      screening_results: screeningsRes.data,
      alerts: alertsRes.data,
      brand_content: brandContentRes.data,
      audit_log: auditRes.data,
    };
  });

export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ password: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // First verify password by attempting sign-in
    const { data: userData } = await context.supabase.auth.getUser();
    if (!userData.user?.email) throw new Error("Unable to verify user");

    const { error: authErr } = await context.supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: data.password,
    });
    if (authErr) throw new Error("Incorrect password");

    // Delete all user data (RLS + CASCADE handles most, but let's be explicit)
    await Promise.all([
      context.supabase.from("audit_log").delete().eq("user_id", context.userId),
      context.supabase.from("alerts").delete().eq("user_id", context.userId),
      context.supabase.from("brand_health_scores").delete().eq("user_id", context.userId),
      context.supabase.from("brand_content").delete().eq("user_id", context.userId),
      context.supabase.from("screening_results").delete().eq("user_id", context.userId),
      context.supabase.from("content_items").delete().eq("user_id", context.userId),
      context.supabase.from("monitored_handles").delete().eq("user_id", context.userId),
      context.supabase.from("profiles").delete().eq("id", context.userId),
    ]);

    // Sign out (account deletion via Supabase admin would require service role)
    await context.supabase.auth.signOut();
  });