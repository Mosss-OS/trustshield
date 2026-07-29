import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Pecto" },
      { name: "description", content: "Pecto Privacy Policy." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight">Pecto</span>
        </Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to home
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-4xl tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: July 27, 2026</p>

        <div className="prose prose-neutral dark:prose-invert mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold">1. Data We Collect</h2>
            <p className="mt-2 text-muted-foreground">Pecto collects only what's necessary to provide the Service:</p>
            <ul className="mt-2 list-disc pl-6 text-muted-foreground">
              <li><strong className="text-foreground">Account information:</strong> email, display name (provided during signup)</li>
              <li><strong className="text-foreground">Profile preferences:</strong> industry, goals, tone/voice (optional, set by you)</li>
              <li><strong className="text-foreground">Content you submit:</strong> text you paste for screening (stored for your history)</li>
              <li><strong className="text-foreground">Screening results:</strong> AI analysis of submitted content</li>
              <li><strong className="text-foreground">Brand content:</strong> posts you save or draft through the Brand Builder</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. What We Never Collect</h2>
            <ul className="mt-2 list-disc pl-6 text-muted-foreground">
              <li>We never access your social media accounts directly (for MVP, you paste content manually)</li>
              <li>We never store passwords in plain text</li>
              <li>We never sell your data to third parties</li>
              <li>We never use your data to train AI models</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. How We Use Your Data</h2>
            <ul className="mt-2 list-disc pl-6 text-muted-foreground">
              <li>To provide screening and brand-building features</li>
              <li>To improve AI accuracy (anonymized, aggregated only)</li>
              <li>To send you relevant notifications about your reputation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Data Retention</h2>
            <p className="mt-2 text-muted-foreground">
              We retain your data only as long as your account is active. When you delete your account,
              all personal data is permanently removed. We maintain minimal audit logs for security purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Your Rights (GDPR / CCPA / NDPR)</h2>
            <p className="mt-2 text-muted-foreground">You have the right to:</p>
            <ul className="mt-2 list-disc pl-6 text-muted-foreground">
              <li><strong className="text-foreground">Access:</strong> Export all your data at any time (Settings → Export My Data)</li>
              <li><strong className="text-foreground">Rectification:</strong> Update your profile and preferences</li>
              <li><strong className="text-foreground">Erasure:</strong> Delete your account and all associated data (Settings → Delete Account)</li>
              <li><strong className="text-foreground">Portability:</strong> Export your data in JSON format</li>
              <li><strong className="text-foreground">Object:</strong> Opt out of non-essential data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Data Security</h2>
            <p className="mt-2 text-muted-foreground">
              We use industry-standard security measures including encrypted connections (TLS),
              authentication via Supabase Auth, and Row Level Security to ensure only you can access your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Contact</h2>
            <p className="mt-2 text-muted-foreground">
               Questions about this Privacy Policy? Contact us through the Pecto support channel.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}