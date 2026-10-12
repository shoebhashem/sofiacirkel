import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Sofiacirkel",
  description: "How Sofiacirkel collects, uses, and protects your personal data.",
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "32x32" }],
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-md bg-[#111] overflow-hidden flex items-center justify-center shrink-0">
              <Image src="/logo.png" alt="" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-serif text-base font-bold tracking-wide">Sofiacirkel</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <h1 className="font-serif text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: October 12, 2026</p>

        <div className="flex flex-col gap-8 text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold text-base mb-2">Who we are</h2>
            <p className="text-muted-foreground">
              Sofiacirkel is a reading platform at{" "}
              <span className="text-foreground font-mono text-xs">sofiacirkel.com</span>, operated
              by Shoeb Hashem. If you have any questions about this policy, contact us at{" "}
              <span className="text-foreground font-mono text-xs">shoeb.hashem@gmail.com</span>.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">What data we collect</h2>
            <p className="text-muted-foreground mb-3">
              Sofiacirkel has no sign-up form. You sign in through Google or Apple, which provides
              us with:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Your email address</li>
              <li>Your display name</li>
              <li>Your profile photo (avatar)</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              We collect no other personal data. We use no advertising networks, analytics
              trackers, or third-party marketing services.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Why we collect it</h2>
            <p className="text-muted-foreground mb-3">
              Your data is used solely to operate the service:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>To identify you when you sign in</li>
              <li>To display your name and avatar to members of circles you belong to</li>
              <li>To associate books and ratings with your account</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Who we share it with</h2>
            <p className="text-muted-foreground mb-3">
              We use the following sub-processors to run the service:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <span className="text-foreground font-medium">Supabase</span> — database and
                authentication infrastructure. Data is stored within the EU.
              </li>
              <li>
                <span className="text-foreground font-medium">Google / Apple</span> — OAuth
                providers. We receive only the profile data listed above; we do not receive your
                Google or Apple passwords.
              </li>
              <li>
                <span className="text-foreground font-medium">Netlify</span> — web hosting.
              </li>
            </ul>
            <p className="text-muted-foreground mt-3">
              We share no personal data with any other third party, and we never sell your data.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Cookies</h2>
            <p className="text-muted-foreground">
              We use a single session cookie set by Supabase, which is strictly necessary for
              authentication. Without it, you cannot stay signed in. We use no analytics,
              advertising, or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">How long we keep your data</h2>
            <p className="text-muted-foreground">
              We keep your data for as long as your account is active. If you leave all your
              circles and the circles are deleted, your profile data remains linked to your
              account. You can request full deletion of your account and all associated data at
              any time — see "Your rights" below.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Your rights</h2>
            <p className="text-muted-foreground mb-3">
              Under the GDPR, you have the right to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account and all associated data</li>
              <li>Object to or restrict processing</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              To exercise any of these rights, email{" "}
              <span className="text-foreground font-mono text-xs">shoeb.hashem@gmail.com</span>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Changes to this policy</h2>
            <p className="text-muted-foreground">
              We may update this policy from time to time. Material changes will be reflected in
              the "Last updated" date at the top of this page.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <span className="font-serif italic text-sm text-muted-foreground">Sofiacirkel</span>
        </div>
      </footer>
    </div>
  );
}
