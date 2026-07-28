import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getGateway } from "./ai-gateway.server";

const RequestTypeEnum = z.enum(["dmca", "defamation", "gdpr", "platform_report"]);
const RequestStatusEnum = z.enum(["pending", "submitted", "resolved", "denied"]);

export const createRemediationRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        scan_result_id: z.string().uuid(),
        request_type: RequestTypeEnum,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Fetch the screening result and its content
    const { data: result, error: rErr } = await context.supabase
      .from("screening_results")
      .select("*, content_items(*)")
      .eq("id", data.scan_result_id)
      .eq("user_id", context.userId)
      .single();
    if (rErr) throw new Error(rErr.message);

    // Get user profile for templates
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("display_name, industry")
      .eq("id", context.userId)
      .maybeSingle();

    const gateway = getGateway();

    const SYSTEM_PROMPT = `You are a legal notice drafter for TrustShield. Generate a professional ${data.request_type.toUpperCase()} notice based on the provided content and user information. Include:
- Proper legal formatting
- Specific references to the content in question
- Appropriate legal basis
- Clear action requested
- Professional but firm tone

For DMCA: Include copyright ownership statement and DMCA §512 reference.
For defamation: Include factual basis for the claim and requested remedies.
For GDPR: Include specific data subject rights under GDPR Article 17 (right to erasure).
For platform_report: Reference specific community guidelines violations.

Keep it under 800 words. Return ONLY the notice text, no preamble.`;

    const contentType = result.content_items?.content ?? "(content not available)";
    const categoryLabel = result.category.replace(/_/g, " ");

    let requestBody: string;
    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        system: SYSTEM_PROMPT,
        prompt: `USER INFORMATION:
Name: ${profile?.display_name ?? "(not set)"}
Industry: ${profile?.industry ?? "(not set)"}

CONTENT TO ADDRESS (classified as ${categoryLabel}, severity ${result.severity}):
"""
${contentType}
"""

RATIONALE FOR THIS FLAG:
${result.rationale}

Generate a professional ${data.request_type} notice.`,      });
      requestBody = text;
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes("429")) throw new Error("AI is rate-limited. Please retry in a moment.");
      if (msg.includes("402")) throw new Error("AI credits exhausted.");
      throw new Error(`Template generation failed: ${msg}`);
    }

    // Save the request
    const { data: request, error: reqErr } = await context.supabase
      .from("remediation_requests")
      .insert({
        user_id: context.userId,
        scan_result_id: data.scan_result_id,
        request_type: data.request_type,
        status: "pending",
        request_body: requestBody,
      })
      .select()
      .single();
    if (reqErr) throw new Error(reqErr.message);

    return request;
  });

export const listRemediationRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("remediation_requests")
      .select("*, scan_result_id, request_type, status, request_body, submitted_at, resolved_at, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const updateRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: RequestStatusEnum,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const updates: Record<string, unknown> = { status: data.status };
    if (data.status === "submitted") updates.submitted_at = new Date().toISOString();
    if (data.status === "resolved" || data.status === "denied") updates.resolved_at = new Date().toISOString();

    const { error } = await context.supabase
      .from("remediation_requests")
      .update(updates)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
  });