import { ArrowUpRight, BookOpen, Box, Calendar, Coins, Crown, Feather, Globe, Hourglass, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { Show } from '@clerk/react';
import { getGetTodayCompetitionQueryKey, useGetArchive, useGetTodayCompetition } from '@workspace/api-client-react';
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
        <section className="frost-hero relative border-b border-primary/10 pb-10 pt-12 md:pb-16 md:pt-24">
          <FrostDetail kind="snowflake" className="right-[12%] top-8 hidden rotate-12 md:block" />
          <FrostDetail className="right-[4%] top-28 hidden md:block" />
          <div className="relative z-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
               <p className="inline-flex items-center gap-1.5 font-mono-ui text-[10px] font-bold uppercase tracking-[.24em] text-accent"><Globe size={11} aria-hidden="true" />A live page from the internet</p>
               <h1 className="mt-5 flex max-w-4xl items-baseline gap-4 font-display text-[clamp(4.25rem,11vw,8.8rem)] leading-[.8] tracking-[-.06em] text-primary">
                <Calendar className="hidden shrink-0 text-secondary md:block" size={44} strokeWidth={1.5} aria-hidden="true" />
                {today ? formatDate(today.date) : 'Today'}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground md:text-lg">
                 One ordinary day, held open for a few more hours. People leave a story, strangers decide what it is worth, and midnight does the rest.
              </p>
            </div>
            <div className="relative border-l border-primary/10 pl-5 md:min-w-[190px]">
              <FrostDetail kind="snowflake" className="-right-2 -top-5" />
               <p className="inline-flex items-center gap-1.5 font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground"><Hourglass size={11} aria-hidden="true" />freezes in</p>
              <div className="mt-2 text-2xl text-primary">
                {today ? <Countdown closingTimestamp={today.closingTimestamp} serverTime={today.serverTime} /> : '—'}
              </div>
               <p className="mt-5 inline-flex items-center gap-1.5 font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground"><Box size={11} aria-hidden="true" />highest standing</p>
              <p className="mt-1 font-display text-3xl text-accent">{leader ? formatMoney(leader.runningTotalCents) : 'No bids yet'}</p>
            </div>
          </div>

          <div className="frost-leader relative z-10 mt-10 border-y border-primary/10 py-6 md:flex md:items-center md:justify-between md:gap-8">
            <FrostDetail className="right-3 top-3" />
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Crown size={12} className="text-secondary" aria-hidden="true" />currently leading</p>
              {leader ? (
                <>
                  <h2 className="mt-2 truncate font-display text-3xl text-primary md:text-4xl">{leader.displayName}</h2>
                  <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-6 text-muted-foreground">&ldquo;{leader.story}&rdquo;</p>
                </>
              ) : (
                <p className="mt-2 font-display text-3xl text-primary">The first story is still hiding.</p>
              )}
               <p className="mt-3 text-xs italic text-muted-foreground">{leader ? 'The lead is temporary. The date is not.' : 'The clock is waiting for a first sentence.'}</p>
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
             <h2 className="font-display text-3xl text-primary md:text-4xl">The page, in progress</h2>
             <Link href="/competition" className="quiet-link text-xs font-bold text-muted-foreground" data-testid="link-home-todays-competition">open the full page →</Link>
          </div>
          <div className="mt-2">
            {todayQuery.isLoading ? (
                 <p className="border-y border-dashed border-primary/15 py-10 text-sm text-muted-foreground">The page is waking up. Check back in a moment.</p>
            ) : todayQuery.error ? (
              <div className="py-8 text-sm text-muted-foreground">
                 <p className="font-display text-2xl text-primary">The live page is out in the cold.</p>
                <button type="button" onClick={() => void todayQuery.refetch()} className="mt-2 font-bold text-primary underline underline-offset-4">Try again</button>
              </div>
            ) : participants.length ? (
               participants.map((participant) => (
                 <div key={participant.id} className="list-row grid gap-3 border-b border-primary/10 py-5 md:grid-cols-[48px_150px_1fr_auto] md:items-start md:gap-4" data-testid={`row-home-participant-${participant.id}`}>
                   <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">No. {participant.rank}</span>
                   <span className="text-sm font-bold text-primary">{participant.displayName}</span>
                   <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">&ldquo;{participant.story}&rdquo;</p>
                   <span className="font-mono-ui text-sm font-bold text-accent md:text-right">{formatMoney(participant.runningTotalCents)}</span>
                </div>
              ))
            ) : (
               <div className="border-y border-dashed border-primary/15 py-10">
                 <p className="font-display text-2xl text-primary">Nothing has been written into today yet.</p>
                 <p className="mt-2 text-sm leading-6 text-muted-foreground">A blank page is still a kind of record.</p>
               </div>
            )}
          </div>
        </section>

        <section className="border-t border-primary/10 py-8" data-testid="section-recent-history">
          <div className="flex items-baseline justify-between gap-4">
             <h2 className="font-display text-2xl text-primary">What made it through</h2>
             <Link href="/archive" className="quiet-link inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground" data-testid="link-home-archive"><BookOpen size={12} aria-hidden="true" />enter the archive →</Link>
          </div>
          <div className="mt-4 divide-y divide-primary/10">
            {archiveQuery.isLoading ? (
              <p className="py-4 text-sm text-muted-foreground">Looking backward…</p>
            ) : recentHistory.length ? (
              recentHistory.map((item) => (
                <Link key={item.id} href={`/archive/${item.date}`} className="flex items-center justify-between gap-4 py-4 text-sm transition-colors hover:text-accent" data-testid={`link-home-history-${item.date}`}>
                  <span className="text-primary">{formatDate(item.date)}</span>
                   <span className="text-right text-muted-foreground">{item.winnerDisplayName ?? 'No recorded winner'} <span className="text-primary/30">/</span> {item.winningStandingCents !== null ? formatMoney(item.winningStandingCents) : '—'}</span>
                </Link>
              ))
            ) : (
              <p className="py-4 text-sm text-muted-foreground">The archive is still waiting for its first frozen day.</p>
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
          <h1 className="mt-5 font-display text-[clamp(3.8rem,9vw,7rem)] leading-[.8] tracking-[-.05em] text-primary">Today&apos;s<br /><span className="inline-flex items-center gap-3 text-accent italic">evidence.<Sparkles size={26} strokeWidth={1.5} className="hidden text-secondary md:inline" aria-hidden="true" /></span></h1>
          <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
             <p className="max-w-md text-base leading-7 text-muted-foreground">A running list of things people decided were worth leaving behind.</p>
            {todayQuery.data && <div className="text-right text-sm text-muted-foreground"><p>{formatDate(todayQuery.data.date)}</p><Countdown closingTimestamp={todayQuery.data.closingTimestamp} serverTime={todayQuery.data.serverTime} /></div>}
          </div>
        </div>
        <div className="mt-4">
           {todayQuery.isLoading ? <p className="border-y border-dashed border-primary/15 py-10 text-sm text-muted-foreground">The page is waking up. Check back in a moment.</p> : todayQuery.error ? <div className="border-y border-accent/25 py-8 text-sm text-muted-foreground"><p className="font-display text-2xl text-primary">The pieces are out in the cold.</p><button type="button" onClick={() => void todayQuery.refetch()} className="mt-3 font-bold text-primary underline underline-offset-4">Try again</button></div> : participants.length ? participants.map((participant) => (
             <div key={participant.id} className="list-row grid gap-3 border-b border-primary/10 py-6 md:grid-cols-[48px_150px_1fr_auto] md:items-start md:gap-4" data-testid={`row-explore-participant-${participant.id}`}>
               <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">No. {participant.rank}</span>
              <span className="text-sm font-bold text-primary">{participant.displayName}</span>
              <p className="text-sm leading-6 text-muted-foreground">&ldquo;{participant.story}&rdquo;</p>
              <span className="font-mono-ui text-sm font-bold text-accent">{formatMoney(participant.runningTotalCents)}</span>
            </div>
           )) : <div className="border-y border-dashed border-primary/15 py-10"><p className="font-display text-2xl text-primary">The page is blank on purpose.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Someone will decide what today was about.</p></div>}
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Show when="signed-out">
            <PrimaryButton href="/sign-up" testId="button-explore-write">Write on this page <ArrowUpRight size={16} /></PrimaryButton>
          </Show>
          <Show when="signed-in">
            <PrimaryButton href="/participate" testId="button-explore-participate">Write on this page <ArrowUpRight size={16} /></PrimaryButton>
          </Show>
           <Link href="/archive" className="quiet-link inline-flex items-center gap-2 px-2 py-3 text-sm font-bold text-muted-foreground">Read the frozen days →</Link>
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
              <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">A small contest about what deserves to survive the day.</p>
            </div>
            <div className="border-l border-primary/10 pl-5 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-1.5"><Hourglass size={12} aria-hidden="true" />freezes in</p>
              {competition && <Countdown closingTimestamp={competition.closingTimestamp} serverTime={competition.serverTime} />}
               <p className="mt-4 inline-flex items-center gap-1.5"><Box size={12} aria-hidden="true" />highest standing <span className="font-display text-2xl text-accent">{leader ? formatMoney(leader.runningTotalCents) : '—'}</span></p>
            </div>
          </div>
        </section>
        <section className="py-8" data-testid="page-competition-list">
          <div className="flex items-baseline justify-between border-b border-primary/10 pb-4">
            <h2 className="font-display text-3xl text-primary">The pieces</h2>
             <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">{participants.length} in play</span>
          </div>
           {todayQuery.isLoading ? <p className="border-y border-dashed border-primary/15 py-10 text-sm text-muted-foreground">Waiting for today to take shape…</p> : todayQuery.error ? <div className="border-y border-accent/25 py-8 text-sm text-muted-foreground"><p className="font-display text-2xl text-primary">The live page is out in the cold.</p><button type="button" onClick={() => void todayQuery.refetch()} className="mt-3 font-bold text-primary underline underline-offset-4">Try again</button></div> : participants.length ? participants.map((participant) => (
             <div key={participant.id} className="list-row grid gap-3 border-b border-primary/10 py-6 md:grid-cols-[48px_150px_1fr_auto] md:items-start md:gap-4">
               <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">No. {participant.rank}</span>
              <span className="text-sm font-bold text-primary">{participant.displayName}</span>
              <p className="text-sm leading-6 text-muted-foreground">&ldquo;{participant.story}&rdquo;</p>
              <span className="font-mono-ui text-sm font-bold text-accent">{formatMoney(participant.runningTotalCents)}</span>
            </div>
           )) : <div className="border-y border-dashed border-primary/15 py-10"><p className="font-display text-2xl text-primary">No stories are in play yet.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">The first one changes the temperature.</p></div>}
        </section>
        <div className="flex flex-wrap gap-4 border-t border-primary/10 pt-6">
          <Show when="signed-out">
            <PrimaryButton href="/sign-up" testId="button-competition-sign-up">Place a Payment <ArrowUpRight size={16} /></PrimaryButton>
          </Show>
          <Show when="signed-in">
            <PrimaryButton href="/participate" testId="button-competition-participate">Place a Payment <ArrowUpRight size={16} /></PrimaryButton>
          </Show>
           <Link href="/how-it-works" className="quiet-link inline-flex items-center px-2 py-3 text-sm font-bold text-muted-foreground">How does this work? →</Link>
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