import { useGetSiteStats } from '@workspace/api-client-react';
import { SectionKicker, SiteFooter, SiteNav } from '@/components/site';

export function RefundPage() {
  const statsQuery = useGetSiteStats();

  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-16 sm:px-8 md:pt-24">
        <SectionKicker>Payments and cancellations</SectionKicker>
        <h1 className="mt-6 max-w-3xl font-display text-[clamp(3.5rem,8vw,7rem)] leading-[.84] tracking-[-.04em] text-primary">
          Refund &amp;<br /><span className="text-accent italic">Cancellation.</span>
        </h1>
        <div className="ice-panel mt-14 space-y-8 rounded-[22px] p-7 sm:p-10">
          <section>
            <h2 className="font-display text-3xl text-primary">Payments are final</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Contributions are real payments and are non-refundable, whether or not your story reaches #1. Choosing not to continue after paying, or ending the day below the top ranking, does not make a payment refundable.
            </p>
          </section>
          <section>
            <h2 className="font-display text-3xl text-primary">Exceptions</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              We will review duplicate or erroneous charges and provide a refund where required by applicable law.
            </p>
          </section>
          <section>
            <h2 className="font-display text-3xl text-primary">Contact us about a charge</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Email <a className="font-bold text-primary underline underline-offset-4 hover:text-accent" href="mailto:hello@pieceofhistory.app">hello@pieceofhistory.app</a>. Include the account email, approximate charge date and amount, and Razorpay payment reference if available. Do not email full card details.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter stats={statsQuery.data} />
    </div>
  );
}
