import { ArrowUpRight, Lock } from 'lucide-react';
import { Link } from 'wouter';
import { useGetSiteStats } from '@workspace/api-client-react';
import { SectionKicker, SiteFooter, SiteNav } from '@/components/site';

export function TermsPage() {
  const statsQuery = useGetSiteStats();

  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-16 sm:px-8 md:pt-24">
        <SectionKicker>The small print</SectionKicker>
        <h1 className="mt-6 max-w-3xl font-display text-[clamp(4rem,8vw,7rem)] leading-[.84] tracking-[-.04em] text-primary">
          Terms &amp;<br /><span className="text-accent italic">Conditions.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">
          This is a small public record for meaningful days. The rules are brief because the promise is simple: submit honestly, pay voluntarily, and understand that a winning story stays visible.
        </p>

        <div className="mt-14 divide-y divide-primary/10 border-y border-primary/10">
          <section className="py-8 sm:py-10">
            <h2 className="font-display text-3xl text-primary">How a day works</h2>
            <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-7 text-muted-foreground marker:text-accent">
              <li>Users voluntarily bid for a specific date.</li>
              <li>The highest valid, confirmed bid at 23:59:59 wins that date.</li>
              <li className="flex gap-2"><Lock size={13} className="mt-0.5 shrink-0 text-secondary" aria-hidden="true" /><span>Once the date is frozen, the winning story becomes public.</span></li>
              <li>Completed bids are non-refundable unless required by applicable law.</li>
            </ul>
          </section>

          <section className="py-8 sm:py-10">
            <h2 className="font-display text-3xl text-primary">What you submit</h2>
            <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-7 text-muted-foreground marker:text-accent">
              <li>You are responsible for the stories and content you submit.</li>
              <li>Do not submit illegal, hateful, abusive, sexually explicit, fraudulent, private or confidential, or copyright-infringing content.</li>
              <li>We may remove content that violates these rules.</li>
              <li>Only submit information you are comfortable making public.</li>
            </ul>
          </section>

          <section id="privacy" className="bg-muted/45 py-8 sm:py-10">
            <h2 className="font-display text-3xl text-primary">Privacy</h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              Stories that win become part of the public archive. Please avoid submitting personal or confidential information about yourself or anyone else.
            </p>
          </section>
        </div>

        <Link href="/" className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent" data-testid="link-terms-back">
          Back to the page <ArrowUpRight size={16} />
        </Link>
      </main>
      <SiteFooter stats={statsQuery.data} />
    </div>
  );
}