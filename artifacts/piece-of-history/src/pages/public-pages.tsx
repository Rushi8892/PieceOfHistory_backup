import { ArrowUpRight, BookOpen, Coins, Feather } from 'lucide-react';
import { Link } from 'wouter';
import { Show } from '@clerk/react';
import { getGetTodayCompetitionQueryKey, useGetArchive, useGetSiteStats, useGetTodayCompetition } from '@workspace/api-client-react';
import { Countdown, FrostDetail, HowStep, PrimaryButton, SectionKicker, SiteFooter, SiteNav, formatDate, formatMoney } from '@/components/site';

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
          <FrostDetail kind="snowflake" className="right-[12%] top-8 hidden rotate-12 md:block" />
          <FrostDetail className="right-[4%] top-28 hidden md:block" />
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
            <div className="relative border-l border-primary/10 pl-5 md:min-w-[190px]">
              <FrostDetail kind="snowflake" className="-right-2 -top-5" />
              <p className="text-xs text-muted-foreground">freezes in</p>
              <div className="mt-2 text-2xl text-primary">
                {today ? <Countdown closingTimestamp={today.closingTimestamp} serverTime={today.serverTime} /> : '—'}
              </div>
              <p className="mt-5 text-xs text-muted-foreground">highest bid</p>
              <p className="mt-1 font-display text-3xl text-accent">{leader ? formatMoney(leader.runningTotalCents) : 'No bids yet'}</p>
            </div>
          </div>

          <div className="frost-leader relative z-10 mt-10 border-y border-primary/10 py-6 md:flex md:items-center md:justify-between md:gap-8">
            <FrostDetail className="right-3 top-3" />
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
              <p className="mt-3 text-xs italic text-muted-foreground">{leader ? 'Someone is trying to steal today.' : 'The clock is waiting for someone to care.'}</p>
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
  const todayQuery = useGetTodayCompetition();
  const participants = todayQuery.data?.participants ?? [];
  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-5 pb-20 pt-12 sm:px-8 md:pt-20">
        <div className="border-b border-primary/10 pb-8">
          <SectionKicker>Explore</SectionKicker>
          <h1 className="mt-5 font-display text-[clamp(3.6rem,8vw,6.5rem)] leading-[.84] tracking-[-.04em] text-primary">Today&apos;s<br /><span className="text-accent italic">pieces.</span></h1>
          <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
            <p className="max-w-md text-base leading-7 text-muted-foreground">A small list of things people decided were worth remembering.</p>
            {todayQuery.data && <div className="text-right text-sm text-muted-foreground"><p>{formatDate(todayQuery.data.date)}</p><Countdown closingTimestamp={todayQuery.data.closingTimestamp} serverTime={todayQuery.data.serverTime} /></div>}
          </div>
        </div>
        <div className="mt-4">
          {todayQuery.isLoading ? <p className="py-8 text-sm text-muted-foreground">Waiting for today to load…</p> : todayQuery.error ? <div className="py-8 text-sm text-muted-foreground"><p>The pieces are out in the cold.</p><button type="button" onClick={() => void todayQuery.refetch()} className="mt-2 font-bold text-primary underline underline-offset-4">Try again</button></div> : participants.length ? participants.map((participant) => (
            <div key={participant.id} className="grid gap-2 border-b border-primary/10 py-6 md:grid-cols-[48px_150px_1fr_auto] md:items-start md:gap-4" data-testid={`row-explore-participant-${participant.id}`}>
              <span className="font-mono-ui text-xs text-muted-foreground">#{participant.rank}</span>
              <span className="text-sm font-bold text-primary">{participant.displayName}</span>
              <p className="text-sm leading-6 text-muted-foreground">&ldquo;{participant.story}&rdquo;</p>
              <span className="font-mono-ui text-sm font-bold text-accent">{formatMoney(participant.runningTotalCents)}</span>
            </div>
          )) : <p className="py-8 text-sm text-muted-foreground">No pieces yet. The page is blank on purpose.</p>}
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Show when="signed-out">
            <PrimaryButton href="/sign-up" testId="button-explore-write">Write on this page <ArrowUpRight size={16} /></PrimaryButton>
          </Show>
          <Show when="signed-in">
            <PrimaryButton href="/participate" testId="button-explore-participate">Write on this page <ArrowUpRight size={16} /></PrimaryButton>
          </Show>
          <Link href="/archive" className="inline-flex items-center gap-2 px-2 py-3 text-sm font-bold text-muted-foreground hover:text-primary">Read the frozen days →</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function CompetitionPage() {
  const todayQuery = useGetTodayCompetition({
    query: {
      queryKey: getGetTodayCompetitionQueryKey(),
      refetchInterval: 5000,
      refetchIntervalInBackground: true,
    },
  });
  const competition = todayQuery.data;
  const participants = competition?.participants ?? [];
  const leader = participants[0];
  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-5 pb-20 pt-12 sm:px-8 md:pt-20">
        <section className="border-b border-primary/10 pb-8">
          <SectionKicker>Today&apos;s competition</SectionKicker>
          <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="font-display text-[clamp(3.8rem,8vw,6.5rem)] leading-[.84] tracking-[-.04em] text-primary">{competition ? formatDate(competition.date) : 'Today'}</h1>
              <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">One ordinary day, briefly made competitive.</p>
            </div>
            <div className="border-l border-primary/10 pl-5 text-sm text-muted-foreground">
              <p>freezes in</p>
              {competition && <Countdown closingTimestamp={competition.closingTimestamp} serverTime={competition.serverTime} />}
              <p className="mt-4">highest bid <span className="font-display text-2xl text-accent">{leader ? formatMoney(leader.runningTotalCents) : '—'}</span></p>
            </div>
          </div>
        </section>
        <section className="py-8" data-testid="page-competition-list">
          <div className="flex items-baseline justify-between border-b border-primary/10 pb-4">
            <h2 className="font-display text-3xl text-primary">The pieces</h2>
            <span className="text-xs text-muted-foreground">{participants.length} today</span>
          </div>
          {todayQuery.isLoading ? <p className="py-8 text-sm text-muted-foreground">Waiting for today to load…</p> : todayQuery.error ? <div className="py-8 text-sm text-muted-foreground"><p>The pieces are out in the cold.</p><button type="button" onClick={() => void todayQuery.refetch()} className="mt-2 font-bold text-primary underline underline-offset-4">Try again</button></div> : participants.length ? participants.map((participant) => (
            <div key={participant.id} className="grid gap-2 border-b border-primary/10 py-6 md:grid-cols-[48px_150px_1fr_auto] md:items-start md:gap-4">
              <span className="font-mono-ui text-xs text-muted-foreground">#{participant.rank}</span>
              <span className="text-sm font-bold text-primary">{participant.displayName}</span>
              <p className="text-sm leading-6 text-muted-foreground">&ldquo;{participant.story}&rdquo;</p>
              <span className="font-mono-ui text-sm font-bold text-accent">{formatMoney(participant.runningTotalCents)}</span>
            </div>
          )) : <p className="py-8 text-sm text-muted-foreground">No pieces yet. The page is blank on purpose.</p>}
        </section>
        <div className="flex flex-wrap gap-4 border-t border-primary/10 pt-6">
          <Show when="signed-out">
            <PrimaryButton href="/sign-up" testId="button-competition-sign-up">Place a Payment <ArrowUpRight size={16} /></PrimaryButton>
          </Show>
          <Show when="signed-in">
            <PrimaryButton href="/participate" testId="button-competition-participate">Place a Payment <ArrowUpRight size={16} /></PrimaryButton>
          </Show>
          <Link href="/how-it-works" className="inline-flex items-center px-2 py-3 text-sm font-bold text-muted-foreground hover:text-primary">How does this work? →</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function HowItWorksPage() {
  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8 md:pt-20">
        <SectionKicker>How it works</SectionKicker>
        <h1 className="mt-5 font-display text-[clamp(3.8rem,8vw,6.5rem)] leading-[.84] tracking-[-.04em] text-primary">One day.<br /><span className="text-accent italic">One story.</span></h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground">A strange little daily ritual: write something true, let people back it, and see which memory stays on top.</p>
        <div className="mt-12 divide-y divide-primary/10 border-y border-primary/10">
          <HowStep number="01" title="Write a day" icon={<Feather size={17} />}>Tell one short story about one meaningful day. Ordinary is encouraged.</HowStep>
          <HowStep number="02" title="Back a story" icon={<Coins size={17} />}>Add a voluntary payment to the piece that deserves your attention.</HowStep>
          <HowStep number="03" title="Make history" icon={<BookOpen size={17} />}>At the closing time, the highest confirmed total wins and the day freezes.</HowStep>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/competition" className="text-sm font-bold text-primary hover:text-accent">See today&apos;s competition →</Link>
          <Link href="/terms" className="text-sm font-bold text-muted-foreground hover:text-primary">Read the terms →</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}