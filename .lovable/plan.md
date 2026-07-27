## TrustShield MVP — Phase 1A + 1B

A working AI reputation platform: auth, onboarding, dashboard shell, and an AI-powered screening pipeline that classifies content for reputational risk with plain-language explanations.

### Design direction
- Modern SaaS aesthetic (Stripe/Linear feel), calm and trustworthy — not alarmist.
- Neutral base palette with a single deep accent (deep teal or indigo, not purple). Red/orange reserved strictly for high-severity flags.
- Light + dark mode via semantic tokens in `src/styles.css`.
- Typography: Inter for UI, a subtle display face (e.g. Instrument Serif) for headings; final choice confirmable after first render.
- Explainable outputs: every flag/score shows the "why" in plain language.

### Phase 1A — Foundation

1. **Enable Lovable Cloud** (database, auth, server functions, storage).
2. **Auth**
   - Email/password + Google sign-in (via Lovable's OAuth broker).
   - Public `/auth` route (sign in / sign up / forgot password) + `/reset-password`.
   - Managed `_authenticated` layout gates the app.
3. **Data model** (migrations with `GRANT`s + RLS scoped to `auth.uid()`):
   - `profiles` (auto-created on signup): name, industry, goals, tone/voice, onboarding_complete.
   - `user_roles` + `app_role` enum + `has_role()` security-definer function.
   - `monitored_handles` (platform, handle/url).
   - `content_items` (raw text/url, platform, source, created_at).
   - `screening_results` (item_id, category, severity, rationale, suggested_action).
   - `brand_metrics` (placeholder for later phases).
4. **Onboarding flow** (`/onboarding`): name → industry/niche → goals → tone → platforms to monitor. Writes to `profiles` + `monitored_handles`, then redirects to dashboard.
5. **Dashboard shell** under `_authenticated`:
   - Sidebar nav: Overview, Screening, Brand Builder, Settings.
   - Overview: risk score card, recent flags, brand metric stubs.
   - Settings: profile, monitored handles, sign out.

### Phase 1B — Screening & red-flag detection

1. **Manual content input** (Phase-1B scope; live social scraping is out of scope for MVP):
   - Screening page lets a user paste text, a URL, or bulk-paste multiple items, tagged with platform.
   - Handles from onboarding shown as context; connectors deferred to a later phase.
2. **AI analysis pipeline** — `createServerFn` (`analyzeContent`) using Lovable AI Gateway:
   - Model: `google/gemini-3.6-flash` via `@ai-sdk/openai-compatible`, structured output with Zod.
   - Categories (per spec §3):
     - Harmful/abusive (hate, harassment, explicit, doxxing, threats, extremism)
     - Reputation risk (controversial statements, unprofessional language, PR liabilities)
     - Legitimate criticism (factual/newsworthy — never suppressed; response tools only)
     - Positive/on-brand
   - For each item: category, severity (info/low/medium/high), plain-language rationale, and a suggested action constrained by policy:
     - `flag_for_removal` — only for harmful/false/abusive
     - `respond_with_context` — for legitimate criticism
     - `leave_alone` — for true/newsworthy/public-record content
     - `amplify` — for on-brand positive content
   - The system prompt hard-codes the core principle: never suggest suppressing true, newsworthy, or public-record content. This is enforced in prompt + schema, not just UI copy.
3. **Screening UI**:
   - Item list with severity chip, category, rationale, suggested action.
   - Detail drawer with full "why" and action buttons (copy response draft, mark reviewed, dismiss).
   - Aggregate risk score on Overview derived from severity distribution.
4. **Brand Builder (stub for 1B)**: a "Draft on-brand post" tool using tone/voice from onboarding — one AI call, editable output. Deeper brand features deferred to Phase 2.

### SEO & metadata
- Per-route `head()` with unique titles/descriptions on `/`, `/auth`, `/onboarding`, dashboard routes.
- Public landing at `/` with sign-in CTA (replaces placeholder). Dashboard lives at `/_authenticated/dashboard`.
- `sitemap.xml` + `robots.txt` for public routes only.

### Explicitly out of scope for this build
- Live social scraping / OAuth to X, IG, LinkedIn, TikTok, YouTube, Facebook.
- Privacy-preserving verification layer (Section 7 future roadmap).
- Payments, teams, notifications, scheduled scans.

### Technical notes
- Stack: TanStack Start + Lovable Cloud + Lovable AI Gateway. No edge functions — all server logic via `createServerFn`.
- Roles stored in `user_roles` (never on profiles) with `has_role()` security-definer, per platform rules.
- All migrations include explicit `GRANT`s for `authenticated` (and `service_role`); no `anon` grants on user data.
- AI calls run server-side only; `LOVABLE_API_KEY` never exposed to the client.
- Structured AI output via Zod schema; failures surface as typed errors in UI, with 429/402 handled explicitly.

Approve to start building, or tell me what to adjust (scope, palette, model choice, category list, etc.).