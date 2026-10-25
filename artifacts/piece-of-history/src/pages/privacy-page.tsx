import { SectionKicker, SiteFooter, SiteNav } from '@/components/site';
import { useGetSiteStats } from '@workspace/api-client-react';

export function PrivacyPage() {
  const statsQuery = useGetSiteStats();

  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-5 pb-24 pt-16 sm:px-8 md:pt-24">
        <SectionKicker>How your information is handled</SectionKicker>
        <h1 className="mt-6 max-w-3xl font-display text-[clamp(4rem,8vw,7rem)] leading-[.84] tracking-[-.04em] text-primary">
          Privacy<br /><span className="text-accent italic">Policy.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">
          This policy explains what Piece of History collects and what becomes public in the archive.
        </p>

        <div className="ice-panel mt-14 divide-y divide-primary/10 overflow-hidden rounded-[22px]">
          <section className="py-8 sm:py-10">
            <h2 className="font-display text-3xl text-primary">Information we collect</h2>
            <ul className="mt-5 list-disc space-y-3 pl-5 text-sm leading-7 text-muted-foreground marker:text-accent">
              <li>Account details used to sign in and identify your account.</li>
              <li>Stories and related details you submit, such as a display name and optional website address.</li>
              <li>Payment references needed to create and verify contributions, including order and payment IDs, amounts, status, and relevant timestamps.</li>
              <li>Basic technical information needed to operate and protect the service.</li>
            </ul>
          </section>

          <section className="py-8 sm:py-10">
            <h2 className="font-display text-3xl text-primary">Payments</h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              Payments are processed by Razorpay. Card details are entered into Razorpay Checkout; Piece of History does not receive or store your full card number or security code. We keep payment references and transaction details needed to confirm contributions, maintain account history, and resolve payment issues.
            </p>
          </section>

          <section className="bg-secondary/10 py-8 sm:py-10">
            <h2 className="font-display text-3xl text-primary">Public stories and permanence</h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              A story that wins its date becomes public in the archive and is intended to remain a permanent public record. Do not include information you or another person wants to keep private. Contact us if you have a question or concern about a published story; publication does not guarantee that it can be removed.
            </p>
          </section>

          <section className="py-8 sm:py-10">
            <h2 className="font-display text-3xl text-primary">Your requests and questions</h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              You can contact us to ask about the information associated with your account or to request a correction or deletion. We will review requests in light of applicable law, payment-record requirements, and the permanent public-archive promise described above.
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Email <a className="font-bold text-primary underline underline-offset-4 hover:text-accent" href="mailto:hello@pieceofhistory.app">hello@pieceofhistory.app</a> with privacy questions or requests.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter stats={statsQuery.data} />
    </div>
  );
}
