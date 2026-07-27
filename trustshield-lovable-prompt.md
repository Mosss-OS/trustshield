# TrustShield — AI Reputation & Personal Brand Platform
### Build Prompt for Lovable

---

## HOW TO USE THIS DOCUMENT
This is written to be pasted into Lovable as your initial build prompt (Section 1–6), then followed up with smaller prompts per feature as you iterate. Section 7 is a **future roadmap** — do not ask Lovable to build all of it at once. Lovable works best when it builds a working app first and adds complexity in follow-up prompts, so the structure below is deliberately phased.

---

## 1. PRODUCT OVERVIEW

**Name:** TrustShield (placeholder — adjust as needed)

**One-line pitch:** An AI-powered platform that scans a person's social media and online presence for reputational risk, helps them clean up or respond to harmful content, and actively builds their personal brand — with an optional privacy-preserving verification layer so achievements and "clean" status can be proven without exposing raw data.

**Who it's for:** Founders, executives, creators, job seekers, professionals, and public figures who want to manage how they appear online.

**Core principle (build this in from the start):** The app never claims it can force-delete third-party content, and it never helps hide or bury content that is true, newsworthy, or a matter of public record. It flags harmful/false/abusive content for removal, and for legitimate criticism it offers *context and response tools*, not suppression. This distinction should be enforced in the AI logic, not just mentioned in copy — see Section 4.

---

## 2. DESIGN DIRECTION

- Clean, modern, professional SaaS aesthetic — think Stripe/Linear/Apple, not a cluttered dashboard.
- Dark mode and light mode.
- Calm, trustworthy color palette (avoid alarmist red-everywhere; reserve red/orange strictly for genuine high-severity flags).
- Real-time feeling dashboard: risk score, flagged items, brand growth metrics.
- Mobile-responsive.
- Explainable AI outputs — every score or flag should show *why*, in plain language, not just a number.

---

## 3. MVP FEATURE SET (build this first, in this order)

### Phase 1A — Foundation
- Auth (email/password + social login via Supabase Auth).
- User onboarding: name, industry/niche, goals, tone/voice preferences, platforms to monitor.
- Dashboard shell: Overview, Screening, Brand Builder, Settings.

### Phase 1B — Screening & Red-Flag Detection
- Users connect or manually input their social profiles/handles (X, Instagram, LinkedIn, TikTok, Facebook, YouTube).
- AI analysis pipeline that classifies content into categories:
  - Harmful/abusive: hate speech, harassment, explicit content, doxxing/privacy leaks (phone numbers, addresses, ID documents), threats, extremism.
  - Off-brand: tone inconsistency, old posts that clash with current professional image.
  - Impersonation/fake accounts using the person's name or photo.
  - Legitimate criticism / newsworthy content (flagged as "not eligible for suppression" — routed to response tools instead).
- Each item gets a **severity score** (Low/Medium/High/Critical) with a plain-language explanation.
- Recommended action per item: Delete, Archive, Make Private, Limit Audience, Remove Metadata, Draft Contextual Response, Report to Platform, Ignore.
- **Human-in-the-loop:** nothing gets auto-deleted or auto-hidden. Every "remove/suppress" action requires explicit user confirmation, and the AI must never recommend suppressing something it classified as legitimate/newsworthy.

### Phase 1C — Remediation Workflows
- Guided takedown-request generator: pre-filled templates for platform reports, DMCA-style copyright requests, defamation notices, and GDPR/NDPR-style erasure requests, based on the flagged item's category.
- Status tracker for submitted requests (Pending / Submitted / Resolved / Denied).
- Explicit UI copy that the app **cannot guarantee removal** — sets realistic expectations.

### Phase 1D — AI Brand Builder
- Onboarding-derived brand voice profile (industry, tone, audience, goals).
- Content generator: LinkedIn posts, X posts, Instagram captions, YouTube scripts, bio/About rewrites — all matching the user's voice.
- Simple content calendar view.
- "Brand Health Score" that improves as red flags are resolved and positive content is published — shown as a trend line over time.

### Phase 1E — Alerts
- Notification when new content mentioning the user's name/brand is detected (simulate via scheduled scan for MVP; real-time listening APIs can come later).

---

## 4. AI LOGIC — SYSTEM PROMPTS

### 4.1 Screening & Classification Agent
```
You are the screening engine inside TrustShield. Analyze the provided content
(social posts, articles, mentions) and classify each item into exactly one of:

- HARMFUL: hate speech, harassment, doxxing, explicit content, threats,
  extremism, credential/identity leaks.
- OFF_BRAND: legal and safe, but inconsistent with the user's stated
  professional tone or goals.
- IMPERSONATION: fake account or AI-generated content impersonating the user.
- LEGITIMATE_CRITICISM: true, newsworthy, or documented public-interest
  content. This is NEVER eligible for suppression, deletion assistance, or
  takedown workflows. Route it to "contextual response" only.

For each item return: category, severity (low/medium/high/critical), a
plain-language reason, and a recommended action from the approved action list
(delete, archive, make_private, limit_audience, remove_metadata,
draft_response, report_to_platform, ignore).

Never recommend suppression of LEGITIMATE_CRITICISM. Never promise that
third-party content can be guaranteed deleted. If uncertain about a
classification, mark it for human review rather than guessing.
```

### 4.2 Brand Builder Agent
```
You are the brand-building engine inside TrustShield. Using the user's stated
industry, audience, goals, and existing content as a style reference, generate
on-brand content (posts, bios, scripts, captions) that match their authentic
voice. Do not fabricate credentials, achievements, or claims the user hasn't
provided. Flag any generated claim that would need factual verification
before publishing.
```

---

## 5. DATA MODEL (starting point for Lovable/Supabase)

- `users` — id, name, industry, goals, tone_preferences, created_at
- `connected_profiles` — id, user_id, platform, handle/url, connected_at
- `scan_results` — id, user_id, profile_id, content_snapshot, category, severity, reasoning, recommended_action, status (open/resolved/ignored), created_at
- `remediation_requests` — id, scan_result_id, request_type (dmca/defamation/gdpr/platform_report), status, submitted_at
- `brand_content` — id, user_id, platform, content_type, content_text, status (draft/scheduled/published), created_at
- `brand_health_scores` — id, user_id, score, computed_at
- `alerts` — id, user_id, message, related_scan_result_id, read (bool), created_at

---

## 6. NON-GOALS / GUARDRAILS (enforce in both UI copy and AI logic)
- Never claim guaranteed removal of third-party content.
- Never suppress or hide content that is true, newsworthy, or part of the public record — only offer contextual response tools for that category.
- Never auto-delete or auto-hide anything without explicit user confirmation.
- Never store more personal data than needed for the feature at hand.
- Never facilitate harassment, doxxing, or impersonation of *others* — this is a defensive tool for the account owner, not an offensive one.

---

## 7. FUTURE ROADMAP (post-MVP — do not build in Lovable's first pass)

These are valuable but require infrastructure Lovable isn't suited for (custom backend services, blockchain nodes, multi-agent orchestration). Plan to build them as separate backend services that the Lovable frontend calls via API once the MVP is validated.

### 7.1 Privacy & Verification Layer (Web3, optional/toggleable)
- Decentralized Identifiers (DIDs) and W3C Verifiable Credentials so a user can prove "profile screened" or "reputation cleared" status without revealing underlying data.
- Zero-knowledge proofs for selective disclosure (e.g., proving a credential is valid without revealing details).
- On-chain layer stores **only hashes, proofs, and timestamps** — never raw content or identity data.
- Low-cost L2 (Polygon, Base, or similar) for anchoring; traditional login remains fully supported — blockchain is additive, never required.
- Shareable "clean reputation" verification badge/report for job or partnership use.

### 7.2 Crisis Intelligence
- Detection of viral negative spikes, coordinated harassment, or bot-driven attacks.
- Severity/spread prediction, drafted holding statements, media response prep.

### 7.3 Reputation Recovery / SEO Engine
- Structured data, schema markup, and positive-content strategy to improve search visibility (legitimate suppression via genuine positive signal, not content removal).
- Wikipedia-readiness checklist, Google Business optimization, author/knowledge-panel support.

### 7.4 Deepfake & Impersonation Detection
- Image/video analysis to detect AI-generated impersonation or manipulated media of the user.

### 7.5 Employer / Recruiter Dashboard
- Opt-in mode where a candidate shares a verified summary (not raw data) with an employer — professionalism score, identity verification, transparent methodology, bias-audited.

### 7.6 Digital Legacy
- Trusted contacts, account recovery, memorialization preferences, encrypted document vault.

### 7.7 Multi-agent AI architecture (later scale-up)
- Split the single screening/brand agents into specialized agents (Social Scanner, News, SEO, Crisis, Security, Legal Assistant, etc.) coordinated by an orchestration layer, once volume justifies the complexity.

---

## 8. LEGAL/COMPLIANCE NOTES
- Terms of service must state clearly: the platform assists with legitimate removal (harassment, doxxing, false content, the user's own old posts) — not suppression of true public-interest information.
- Design for GDPR / NDPR (Nigeria) / CCPA compliance from day one: minimal data retention, clear consent flows, data export, right-to-erasure for the user's *own* data in the platform.
- Keep an audit log of every remediation action taken on a user's behalf.
