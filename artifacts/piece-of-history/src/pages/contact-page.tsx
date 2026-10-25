import { useGetSiteStats } from '@workspace/api-client-react';
import { SectionKicker, SiteFooter, SiteNav } from '@/components/site';

export function ContactPage() {
  const statsQuery = useGetSiteStats();

  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-16 sm:px-8 md:pt-24">
        <SectionKicker>We’re here to help</SectionKicker>
        <h1 className="mt-6 max-w-3xl font-display text-[clamp(4rem,8vw,7rem)] leading-[.84] tracking-[-.04em] text-primary">
          Get in<br /><span className="text-accent italic">touch.</span>
        </h1>
        <div className="ice-panel mt-14 rounded-[22px] p-7 sm:p-10">
          <h2 className="font-display text-3xl text-primary">Contact Piece of History</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            For account, privacy, or payment questions, email us at:
          </p>
          <a
            className="mt-3 inline-block text-lg font-bold text-primary underline underline-offset-4 hover:text-accent"
            href="mailto:hello@pieceofhistory.app"
          >
            hello@pieceofhistory.app
          </a>
        </div>
      </main>
      <SiteFooter stats={statsQuery.data} />
    </div>
  );
}
