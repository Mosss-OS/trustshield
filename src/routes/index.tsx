import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, ScanLine, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrustShield — Protect your reputation, grow your brand" },
      {
        name: "description",
        content:
          "TrustShield uses explainable AI to scan your online presence, flag genuine risks, and help you build a stronger personal brand — never suppressing what's true or newsworthy.",
      },
      { property: "og:title", content: "TrustShield — Protect your reputation, grow your brand" },
      {
        property: "og:description",
        content:
          "Explainable AI for reputation, response, and personal-brand growth. Built on principles, not suppression.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold tracking-tight">TrustShield</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link to="/auth">Get started</Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-20 pb-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Explainable AI · Principled by design
        </span>
        <h1 className="mt-8 font-display text-6xl leading-[1.05] tracking-tight md:text-7xl">
          Your reputation,
          <br />
          <em className="text-primary">on your terms.</em>
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground">
          TrustShield scans your online presence for genuine reputational risk, helps you respond
          well, and grows your personal brand — with every flag explained in plain language.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">
              Start free <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <a
            href="#principles"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            How it works →
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 md:grid-cols-3">
        {[
          {
            icon: ScanLine,
            title: "Screen with context",
            body: "Paste posts, comments, or articles. Get a category, severity, and a plain-language rationale for each — never a black-box score.",
          },
          {
            icon: ShieldCheck,
            title: "Respond, don't suppress",
            body: "For legitimate criticism we suggest a draft response. Content that's true, newsworthy, or public record is never flagged for removal.",
          },
          {
            icon: Sparkles,
            title: "Build your brand",
            body: "On-brand post drafts tuned to your tone and goals, so growing your reputation feels as intentional as protecting it.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-6">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="mt-4 text-base font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <section id="principles" className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <h2 className="font-display text-4xl tracking-tight">Principles baked into the AI.</h2>
          <div className="mt-8 space-y-4 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">We never force-delete third-party content.</span>{" "}
              TrustShield flags harmful, abusive, or provably false content so you can report it through
              official channels — it doesn't and can't reach into someone else's platform.
            </p>
            <p>
              <span className="font-medium text-foreground">We never help bury what's true.</span>{" "}
              If a piece of criticism is factual, newsworthy, or a matter of public record, the system
              is designed to suggest a response — not suppression.
            </p>
            <p>
              <span className="font-medium text-foreground">Every flag is explained.</span> Category,
              severity, and rationale in plain English, so you can decide with full context.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TrustShield
      </footer>
    </div>
  );
}
