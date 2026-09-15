import { ArrowUpRight, BookOpen, Coins, Feather } from 'lucide-react';
import { Link } from 'wouter';
import { Show } from '@clerk/react';
import { getGetTodayCompetitionQueryKey, useGetArchive, useGetSiteStats, useGetTodayCompetition } from '@workspace/api-client-react';
import { CheckLine, Countdown, HowStep, PrimaryButton, SectionKicker, SiteFooter, SiteNav, StoryCard, TodayData, formatDate, formatMoney } from '@/components/site';

export function LandingPage() {
  const todayQuery = useGetTodayCompetition({
    query: {
      queryKey: getGetTodayCompetitionQueryKey(),
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  });
  const archiveQuery = useGetArchive({ page: 1, pageSize: 3 });
  const today = todayQuery.data;
  const participants = today?.participants ?? [];
  const leader = participants[0];
  const recentHistory = archiveQuery.data?.items ?? [];

  return (
    <div className="paper-grain min-h-[100dvh] overflow-hidden">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-5 pb-16 sm:px-8 md:pb-24 lg:px-12">
        <section className="frost-hero relative border-b border-primary/10 pb-10 pt-12 md:pb-14 md:pt-20">
          <div className="relative z-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="font-mono-ui text-xs tracking-wide text-accent">pieceofhistory.lol / today</p>
              <h1 className="mt-4 font-display text-[clamp(4rem,10vw,8rem)] leading-[.82] tracking-[-.05em] text-primary">
                {today ? formatDate(today.date) : 'Today'}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground md:text-lg">
                The internet is keeping score of one ordinary day. Nobody knows why.
              </p>
            </div>
            <div className="border-l border-primary/10 pl-5 md:min-w-[190px]">
              <p className="text-xs text-muted-foreground">freezes in</p>
              <div className="mt-2 text-2xl text-primary">
                {today ? <Countdown closingTimestamp={today.closingTimestamp} serverTime={today.serverTime} /> : '—'}
              </div>
              <p className="mt-5 text-xs text-muted-foreground">highest bid</p>
              <p className="mt-1 font-display text-3xl text-accent">{leader ? formatMoney(leader.runningTotalCents) : 'No bids yet'}</p>
            </div>
          </div>

          <div className="relative z-10 mt-10 border-y border-primary/10 py-6 md:flex md:items-center md:justify-between md:gap-8">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">currently leading</p>
              {leader ? (
                <>
                  <h2 className="mt-2 truncate font-display text-3xl text-primary md:text-4xl">{leader.displayName}</h2>
                  <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-6 text-muted-foreground">&ldquo;{leader.story}&rdquo;</p>
                </>
              ) : (
                <p className="mt-2 font-display text-3xl text-primary">The first story is still hiding.</p>
              )}
            </div>
            <Show when="signed-out">
              <PrimaryButton href="/sign-up" className="mt-6 shrink-0 md:mt-0" testId="button-home-make-bid">Make your bid <ArrowUpRight size={16} /></PrimaryButton>
            </Show>
            <Show when="signed-in">
              <PrimaryButton href="/participate" className="mt-6 shrink-0 md:mt-0" testId="button-home-make-bid-auth">Write your piece <ArrowUpRight size={16} /></PrimaryButton>
            </Show>
          </div>
        </section>

        <section className="py-10 md:py-14" data-testid="section-todays-competition">
          <div className="flex items-baseline justify-between gap-4 border-b border-primary/10 pb-4">
            <h2 className="font-display text-3xl text-primary md:text-4xl">Today&apos;s Pieces</h2>
            <Link href="/competition" className="text-xs font-bold text-muted-foreground transition-colors hover:text-primary" data-testid="link-home-todays-competition">full competition →</Link>
          </div>
          <div className="mt-2">
            {todayQuery.isLoading ? (
              <p className="py-8 text-sm text-muted-foreground">Waiting for today to load…</p>
            ) : todayQuery.error ? (
              <div className="py-8 text-sm text-muted-foreground">
                <p>The pieces are out in the cold.</p>
                <button type="button" onClick={() => void todayQuery.refetch()} className="mt-2 font-bold text-primary underline underline-offset-4">Try again</button>
              </div>
            ) : participants.length ? (
              participants.map((participant) => (
                <div key={participant.id} className="grid gap-2 border-b border-primary/10 py-5 md:grid-cols-[48px_150px_1fr_auto] md:items-start md:gap-4" data-testid={`row-home-participant-${participant.id}`}>
                  <span className="font-mono-ui text-xs text-muted-foreground">#{participant.rank}</span>
                  <span className="text-sm font-bold text-primary">{participant.displayName}</span>
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">&ldquo;{participant.story}&rdquo;</p>
                  <span className="font-mono-ui text-sm font-bold text-accent">{formatMoney(participant.runningTotalCents)}</span>
                </div>
              ))
            ) : (
              <p className="py-8 text-sm text-muted-foreground">No pieces yet. The page is blank on purpose.</p>
            )}
          </div>
        </section>

        <section className="border-t border-primary/10 py-8" data-testid="section-recent-history">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl text-primary">Recent History</h2>
            <Link href="/archive" className="text-xs font-bold text-muted-foreground transition-colors hover:text-primary" data-testid="link-home-archive">see the archive →</Link>
          </div>
          <div className="mt-4 divide-y divide-primary/10">
            {archiveQuery.isLoading ? (
              <p className="py-4 text-sm text-muted-foreground">Looking backward…</p>
            ) : recentHistory.length ? (
              recentHistory.map((item) => (
                <Link key={item.id} href={`/archive/${item.date}`} className="flex items-center justify-between gap-4 py-4 text-sm transition-colors hover:text-accent" data-testid={`link-home-history-${item.date}`}>
                  <span className="text-primary">{formatDate(item.date)}</span>
                  <span className="text-right text-muted-foreground">{item.winnerDisplayName ?? 'No recorded winner'} · {item.winningStandingCents !== null ? formatMoney(item.winningStandingCents) : '—'}</span>
                </Link>
              ))
            ) : (
              <p className="py-4 text-sm text-muted-foreground">The archive is waiting for its first frozen day.</p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
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
            <Show when="signed-out">
              <PrimaryButton href="/sign-up" variant="light" className="mt-8 w-full" testId="button-explore-write">Write on this page <ArrowUpRight size={16} /></PrimaryButton>
            </Show>
            <Show when="signed-in">
              <PrimaryButton href="/participate" variant="light" className="mt-8 w-full" testId="button-explore-participate">Write on this page <ArrowUpRight size={16} /></PrimaryButton>
            </Show>
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
  const todayQuery = useGetTodayCompetition({
    query: {
      queryKey: getGetTodayCompetitionQueryKey(),
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  });
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
              {competition && <div className="mt-2 text-3xl"><Countdown closingTimestamp={competition.closingTimestamp} serverTime={competition.serverTime} /></div>}
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
            <Show when="signed-out">
              <PrimaryButton href="/sign-up" className="mt-8 w-full" testId="button-competition-sign-up">Place a Payment <ArrowUpRight size={16} /></PrimaryButton>
            </Show>
            <Show when="signed-in">
              <PrimaryButton href="/participate" className="mt-8 w-full" testId="button-competition-participate">Place a Payment <ArrowUpRight size={16} /></PrimaryButton>
            </Show>
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
            <Show when="signed-out">
              <PrimaryButton href="/sign-up" testId="button-how-start-writing">Write the next one <ArrowUpRight size={16} /></PrimaryButton>
            </Show>
            <Show when="signed-in">
              <PrimaryButton href="/participate" testId="button-how-participate">Write the next one <ArrowUpRight size={16} /></PrimaryButton>
            </Show>
          </div>
        </section>
      </main>
      <SiteFooter stats={statsQuery.data} />
    </div>
  );
}