import { ArrowDown, ArrowUpRight, BookOpen, Coins, Feather, Heart, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { useGetSiteStats, useGetTodayCompetition } from '@workspace/api-client-react';
import { CheckLine, Countdown, HowStep, PrimaryButton, SectionKicker, SiteFooter, SiteNav, StatStrip, StoryCard, StoryMark, TodayData, formatDate, formatMoney } from '@/components/site';

export function LandingPage() {
  const statsQuery = useGetSiteStats();
  const todayQuery = useGetTodayCompetition();
  const today = todayQuery.data;

  return (
    <div className="paper-grain min-h-[100dvh] overflow-hidden">
      <SiteNav />
      <main>
        <section className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-20 pt-16 sm:px-8 md:grid-cols-[1.03fr_.97fr] md:items-center md:gap-8 md:pb-28 md:pt-24 lg:px-12">
          <div className="animate-rise-in">
            <SectionKicker>Every day is a chapter</SectionKicker>
            <h1 className="mt-6 max-w-2xl font-display text-[clamp(4.4rem,9vw,8.8rem)] leading-[.84] tracking-[-.045em] text-primary">
              Leave one day <span className="text-accent italic">behind.</span>
            </h1>
            <p className="mt-8 max-w-lg text-lg leading-8 text-muted-foreground md:text-xl">
              Piece of History is a daily storytelling competition for the moments you almost forgot. Write yours down. Let people back it. See what stays.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <PrimaryButton href="/sign-up" testId="button-hero-start-writing">Write your piece <ArrowUpRight size={17} /></PrimaryButton>
              <Link href="/explore" className="inline-flex items-center gap-2 rounded-full px-3 py-3 text-sm font-bold text-primary transition-colors hover:text-accent" data-testid="link-hero-explore">
                Read what&apos;s here <ArrowDown size={16} />
              </Link>
            </div>
            <div className="mt-12 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex -space-x-2">
                {['M', 'S', 'A'].map((letter, index) => <span key={letter} className={`grid h-8 w-8 place-items-center rounded-full border-2 border-background text-xs font-bold ${index === 0 ? 'bg-accent' : index === 1 ? 'bg-secondary' : 'bg-primary text-primary-foreground'}`}>{letter}</span>)}
              </span>
              <span>Small moments. Real people. No perfect prose needed.</span>
            </div>
          </div>
          <div className="relative flex items-center justify-center px-6 md:px-10">
            <StoryMark />
          </div>
        </section>

        <section className="bg-primary py-10 text-primary-foreground">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <StatStrip stats={statsQuery.data} loading={statsQuery.isLoading} />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12">
          <div className="grid gap-12 md:grid-cols-[.75fr_1.25fr] md:items-start">
            <div className="md:sticky md:top-8">
              <SectionKicker>The daily ritual</SectionKicker>
              <h2 className="mt-5 max-w-md font-display text-5xl leading-[.92] text-primary md:text-6xl">What happened to you today?</h2>
              <p className="mt-6 max-w-sm text-base leading-7 text-muted-foreground">Not the highlight reel. The real thing: a sentence someone said, a window you finally opened, the walk home in the rain.</p>
              <PrimaryButton href="/how-it-works" variant="quiet" className="mt-7" testId="button-learn-how-it-works">See how it works <ArrowUpRight size={16} /></PrimaryButton>
            </div>
            <div className="rounded-[30px] bg-muted/60 p-5 sm:p-8">
              <TodayData competition={today} loading={todayQuery.isLoading} error={Boolean(todayQuery.error)} onRetry={() => void todayQuery.refetch()} compact />
              <div className="mt-6 flex items-center justify-between border-t border-primary/10 pt-5">
                <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">Today&apos;s page</span>
                <Link href="/competition" className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-accent" data-testid="link-view-full-competition">View the full page <ArrowUpRight size={15} /></Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-primary/10 bg-secondary/35">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-24 sm:px-8 md:grid-cols-[1fr_1.2fr] md:items-end lg:px-12">
            <div>
              <SectionKicker>Why this exists</SectionKicker>
              <h2 className="mt-5 max-w-lg font-display text-5xl leading-[.94] text-primary md:text-6xl">A little weight for the weightless days.</h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <Heart className="text-accent" size={22} />
                <h3 className="mt-5 font-display text-3xl text-primary">A soft place to land</h3>
                <p className="mt-3 text-sm leading-7 text-primary/70">No hot takes. No performance. Just a room of people paying attention to the same small miracle.</p>
              </div>
              <div>
                <Feather className="text-accent" size={22} />
                <h3 className="mt-5 font-display text-3xl text-primary">A record that grows</h3>
                <p className="mt-3 text-sm leading-7 text-primary/70">Every day gets its own page. Over time, the ordinary becomes an archive of how we were here.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <SectionKicker>Before midnight</SectionKicker>
              <h2 className="mt-5 max-w-xl font-display text-5xl leading-[.94] text-primary md:text-6xl">There&apos;s still time to make today count.</h2>
            </div>
            {today && <div className="rounded-2xl bg-primary px-5 py-4"><Countdown closingTimestamp={today.closingTimestamp} /></div>}
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: <BookOpen size={20} />, title: 'Write one short story', body: 'A few lines about one meaningful day. The only rule is that it happened to you.' },
              { icon: <Coins size={20} />, title: 'Put a little behind it', body: `A minimum of ${today ? formatMoney(today.minimumPaymentCents) : '$1.00'} keeps the day open to everyone, not just the loudest voice.` },
              { icon: <Sparkles size={20} />, title: 'Watch it become history', body: 'The running total decides today’s order. Every contribution is part of the story.' },
            ].map((item, index) => (
              <div key={item.title} className={`rounded-[24px] border border-primary/10 p-7 ${index === 1 ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                <span className={`grid h-10 w-10 place-items-center rounded-full ${index === 1 ? 'bg-secondary text-primary' : 'bg-secondary/50 text-primary'}`}>{item.icon}</span>
                <h3 className="mt-8 font-display text-3xl">{item.title}</h3>
                <p className={`mt-3 text-sm leading-7 ${index === 1 ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}>{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <PrimaryButton href="/sign-up" testId="button-bottom-start-writing">Start with today <ArrowUpRight size={16} /></PrimaryButton>
          </div>
        </section>
      </main>
      <SiteFooter stats={statsQuery.data} />
    </div>
  );
}

export function ExplorePage() {
  const statsQuery = useGetSiteStats();
  const todayQuery = useGetTodayCompetition();
  const participants = todayQuery.data?.participants ?? [];
  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8 md:pt-24 lg:px-12">
        <div className="max-w-3xl">
          <SectionKicker>The open archive</SectionKicker>
          <h1 className="mt-6 font-display text-[clamp(4rem,8vw,7.5rem)] leading-[.84] tracking-[-.04em] text-primary">Read a day<br /><span className="text-accent italic">someone kept.</span></h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">Today&apos;s page is still being written. Read the pieces already here, then leave one of your own before the clock runs out.</p>
        </div>
        <div className="mt-14 grid gap-10 md:grid-cols-[.7fr_1.3fr]">
          <aside className="h-fit rounded-[24px] bg-primary p-7 text-primary-foreground md:sticky md:top-7" data-testid="panel-explore-today">
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-secondary">Today&apos;s page</p>
            <p className="mt-5 font-display text-4xl">{todayQuery.data ? formatDate(todayQuery.data.date) : 'Loading today'}</p>
            {todayQuery.data && <div className="mt-7 border-t border-primary-foreground/15 pt-5"><Countdown closingTimestamp={todayQuery.data.closingTimestamp} /></div>}
            <PrimaryButton href="/sign-up" variant="light" className="mt-8 w-full" testId="button-explore-write">Write on this page <ArrowUpRight size={16} /></PrimaryButton>
          </aside>
          <div>
            {todayQuery.isLoading ? <TodayData competition={undefined} loading error={false} onRetry={() => void todayQuery.refetch()} /> : todayQuery.error ? <TodayData competition={undefined} loading={false} error onRetry={() => void todayQuery.refetch()} /> : participants.length ? <div className="grid gap-5">{participants.map((participant) => <StoryCard key={participant.id} participant={participant} featured={participant.rank === 1} />)}</div> : <TodayData competition={todayQuery.data} loading={false} error={false} onRetry={() => void todayQuery.refetch()} />}
          </div>
        </div>
      </main>
      <SiteFooter stats={statsQuery.data} />
    </div>
  );
}

export function CompetitionPage() {
  const statsQuery = useGetSiteStats();
  const todayQuery = useGetTodayCompetition();
  const competition = todayQuery.data;
  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 md:pt-24 lg:px-12">
        <div className="grid gap-12 md:grid-cols-[.9fr_1.1fr] md:items-end">
          <div>
            <SectionKicker>Competition no. {competition?.id.slice(0, 6) ?? 'today'}</SectionKicker>
            <h1 className="mt-6 font-display text-[clamp(4.2rem,8vw,7.6rem)] leading-[.84] tracking-[-.04em] text-primary">Today&apos;s<br /><span className="text-accent italic">piece.</span></h1>
            <p className="mt-8 max-w-lg text-lg leading-8 text-muted-foreground">One day. One page. The cumulative support behind each story shapes the order before midnight.</p>
          </div>
          <div className="rounded-[28px] bg-primary p-7 text-primary-foreground md:p-9" data-testid="panel-competition-status">
            <div className="flex items-center justify-between gap-5">
              <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-secondary">{competition ? formatDate(competition.date) : 'Loading date'}</span>
              <span className="rounded-full bg-primary-foreground/10 px-3 py-1.5 font-mono-ui text-[10px] uppercase tracking-wide text-primary-foreground/70">{competition?.participants.length ?? 0} pieces</span>
            </div>
            <div className="mt-12">
              <p className="text-sm text-primary-foreground/55">Closes in</p>
              {competition && <div className="mt-2 text-3xl"><Countdown closingTimestamp={competition.closingTimestamp} /></div>}
            </div>
            <p className="mt-8 border-t border-primary-foreground/15 pt-5 text-sm leading-6 text-primary-foreground/65">Every piece starts at {competition ? formatMoney(competition.minimumPaymentCents) : '$1.00'}.</p>
          </div>
        </div>
        <div className="mt-16 grid gap-10 md:grid-cols-[1.4fr_.6fr]">
          <TodayData competition={competition} loading={todayQuery.isLoading} error={Boolean(todayQuery.error)} onRetry={() => void todayQuery.refetch()} />
          <div className="h-fit rounded-[24px] border border-primary/10 bg-card p-7">
            <SectionKicker>Ready when you are</SectionKicker>
            <h2 className="mt-5 font-display text-4xl leading-[.95] text-primary">Your day belongs here, too.</h2>
            <ul className="mt-7 space-y-4"><CheckLine>Write from memory, not performance.</CheckLine><CheckLine>Choose a day that still has a pulse.</CheckLine><CheckLine>Let the room decide what resonates.</CheckLine></ul>
            <PrimaryButton href="/sign-up" className="mt-8 w-full" testId="button-competition-sign-up">Write your piece <ArrowUpRight size={16} /></PrimaryButton>
          </div>
        </div>
      </main>
      <SiteFooter stats={statsQuery.data} />
    </div>
  );
}

export function HowItWorksPage() {
  const statsQuery = useGetSiteStats();
  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main>
        <section className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 md:pb-28 md:pt-24 lg:px-12">
          <SectionKicker>A very small ceremony</SectionKicker>
          <div className="mt-6 grid gap-10 md:grid-cols-[1fr_.8fr] md:items-end">
            <h1 className="font-display text-[clamp(4rem,9vw,8.6rem)] leading-[.84] tracking-[-.045em] text-primary">The rules are<br /><span className="text-accent italic">simple.</span></h1>
            <p className="max-w-md text-lg leading-8 text-muted-foreground">Piece of History turns the day-to-day into something you can hold onto. Here&apos;s the whole idea, in three gentle steps.</p>
          </div>
        </section>
        <section className="bg-primary py-20 text-primary-foreground">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 md:grid-cols-3 lg:px-12">
            <HowStep number="01" title="Write a day" icon={<Feather size={17} />}>Tell one short story about one meaningful day. It can be tender, funny, unfinished, or completely ordinary.</HowStep>
            <HowStep number="02" title="Back a story" icon={<Coins size={17} />}>Each piece starts with the same minimum payment. Add to the story that stays with you and move it up the day&apos;s page.</HowStep>
            <HowStep number="03" title="Make history" icon={<BookOpen size={17} />}>When the day closes, the cumulative totals set the order. Tomorrow begins a new page, and the archive keeps growing.</HowStep>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-8 md:grid-cols-[1.1fr_.9fr] md:items-center lg:px-12">
          <div>
            <SectionKicker>What counts</SectionKicker>
            <h2 className="mt-5 font-display text-5xl leading-[.92] text-primary md:text-6xl">Not a popularity contest. A little proof of attention.</h2>
            <p className="mt-7 max-w-lg text-base leading-8 text-muted-foreground">The money is a simple, visible way to say: this mattered to me. We keep the mechanic clear so the meaning stays in the story.</p>
          </div>
          <div className="rounded-[28px] bg-secondary/45 p-8 md:p-10">
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-primary/60">The fine print, in plain words</p>
            <ul className="mt-7 space-y-5"><CheckLine>Every day has one shared closing time.</CheckLine><CheckLine>Stories stay short so more people can be heard.</CheckLine><CheckLine>Payments are charged in USD and are non-refundable, whether your story wins or not.</CheckLine><CheckLine>Totals are cumulative and public.</CheckLine><CheckLine>Tomorrow is a clean page.</CheckLine></ul>
            <PrimaryButton href="/explore" variant="quiet" className="mt-8" testId="button-how-explore">Read today&apos;s pieces <ArrowUpRight size={16} /></PrimaryButton>
          </div>
        </section>
        <section className="border-t border-primary/10 bg-muted/50">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-20 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
            <div><SectionKicker>The archive is alive</SectionKicker><p className="mt-3 font-display text-4xl text-primary">{statsQuery.data?.piecesOfHistory.toLocaleString() ?? '—'} days worth of remembering.</p></div>
            <PrimaryButton href="/sign-up" testId="button-how-start-writing">Write the next one <ArrowUpRight size={16} /></PrimaryButton>
          </div>
        </section>
      </main>
      <SiteFooter stats={statsQuery.data} />
    </div>
  );
}