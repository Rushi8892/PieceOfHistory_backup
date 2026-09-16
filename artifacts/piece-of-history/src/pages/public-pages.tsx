import { ArrowUpRight, BookOpen, Coins, Feather } from 'lucide-react';
import { Link } from 'wouter';
import { Show } from '@clerk/react';
import { getGetTodayCompetitionQueryKey, useGetArchive, useGetTodayCompetition } from '@workspace/api-client-react';
import { Countdown, FrostDetail, HowStep, IceGlyph, PrimaryButton, SectionKicker, SiteFooter, SiteNav, formatDate, formatMoney } from '@/components/site';

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
  const calendarDate = today?.date
    ? (/^\d{4}-\d{2}-\d{2}$/.test(today.date) ? new Date(`${today.date}T12:00:00`) : new Date(today.date))
    : undefined;
  const hasValidCalendarDate = Boolean(calendarDate && !Number.isNaN(calendarDate.getTime()));

  return (
    <div className="paper-grain min-h-[100dvh] overflow-hidden">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 md:pb-24 lg:px-12">
        <section className="frost-hero relative pb-10 pt-8 md:pb-14 md:pt-14">
          <FrostDetail kind="snowflake" className="right-[8%] top-10 hidden rotate-12 md:block" />
          <FrostDetail className="right-[2%] top-36 hidden md:block" />
          <div className="ice-shell relative z-10 rounded-[26px] p-5 sm:p-8 md:p-10">
            <div className="relative z-10 grid gap-8 md:grid-cols-[190px_1fr] md:items-center">
              <div className="flex justify-center md:justify-start">
                <div className="hero-calendar">
                  <IceGlyph kind="calendar" size={34} className="absolute top-8 text-primary/70" />
                  <span className="mt-7 font-display text-6xl leading-none text-primary">{hasValidCalendarDate ? calendarDate?.getDate() : '—'}</span>
                  <span className="absolute bottom-7 font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-primary/70">{hasValidCalendarDate ? new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(calendarDate) : 'loading'}</span>
                </div>
              </div>
              <div>
                <p className="inline-flex items-center gap-2 font-mono-ui text-[10px] font-bold uppercase tracking-[.22em] text-accent"><IceGlyph kind="calendar" size={13} />Today</p>
                <h1 className="mt-3 max-w-3xl font-display text-[clamp(3.5rem,8vw,7rem)] leading-[.82] tracking-[-.055em] text-primary">{hasValidCalendarDate && today?.date ? formatDate(today.date) : 'Today'}</h1>
                <p className="mt-5 max-w-xl font-display text-lg italic leading-7 text-primary/70 md:text-xl">Who knows… this could be the day someone finally does it.</p>
                <div className="mt-8 grid gap-5 border-t border-primary/10 pt-5 sm:grid-cols-3">
                  <div className="ice-stat">
                    <p className="font-mono-ui text-[9px] font-bold uppercase tracking-[.14em] text-muted-foreground">Current bid</p>
                    <p className="mt-2 font-display text-2xl text-primary">{leader ? formatMoney(leader.runningTotalCents) : '—'}</p>
                  </div>
                  <div className="ice-stat">
                    <p className="font-mono-ui text-[9px] font-bold uppercase tracking-[.14em] text-muted-foreground">Currently leading</p>
                    <p className="mt-2 truncate text-sm font-semibold text-primary">{leader?.displayName ?? 'No one yet'}</p>
                  </div>
                  <div className="ice-stat">
                    <p className="font-mono-ui text-[9px] font-bold uppercase tracking-[.14em] text-muted-foreground">Freezes in</p>
                    <div className="mt-2"><Countdown closingTimestamp={today?.closingTimestamp ?? new Date().toISOString()} serverTime={today?.serverTime} /></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative z-10 mt-8 grid gap-6 border-t border-primary/10 pt-6 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 font-mono-ui text-[9px] font-bold uppercase tracking-[.18em] text-muted-foreground"><IceGlyph kind="page" size={14} className="text-secondary" />Current piece</p>
                {leader ? <p className="mt-2 max-w-2xl font-display text-xl leading-8 text-primary/85">&ldquo;{leader.story}&rdquo;</p> : <p className="mt-2 font-display text-xl text-primary">The first story is still hiding.</p>}
                <p className="mt-2 text-xs italic text-muted-foreground">{leader ? `— ${leader.displayName}` : 'A blank page is still a kind of record.'}</p>
              </div>
              <div>
                <Show when="signed-out"><PrimaryButton href="/sign-up" className="w-full md:w-auto" testId="button-home-make-bid">Make your bid <ArrowUpRight size={16} /></PrimaryButton></Show>
                <Show when="signed-in"><PrimaryButton href="/participate" className="w-full md:w-auto" testId="button-home-make-bid-auth">Write your piece <ArrowUpRight size={16} /></PrimaryButton></Show>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-7 lg:grid-cols-[1.6fr_1fr]" data-testid="section-todays-competition">
          <div className="ice-panel rounded-[20px] p-5 sm:p-7">
            <div className="flex items-baseline justify-between gap-4 border-b border-primary/10 pb-4">
              <h2 className="inline-flex items-center gap-2 font-display text-3xl text-primary md:text-4xl"><IceGlyph kind="crown" size={22} className="text-secondary" />Today&apos;s competition</h2>
              <Link href="/competition" className="quiet-link hidden text-xs font-bold text-muted-foreground sm:inline" data-testid="link-home-todays-competition">open full page →</Link>
            </div>
            <div className="mt-2">
              {todayQuery.isLoading ? <div className="space-y-3 py-8"><div className="h-5 w-28 animate-pulse rounded bg-muted" /><div className="h-14 animate-pulse rounded bg-muted/60" /><div className="h-14 animate-pulse rounded bg-muted/60" /></div> : todayQuery.error ? <div className="py-8 text-sm text-muted-foreground"><p className="font-display text-2xl text-primary">The live page is out in the cold.</p><button type="button" onClick={() => void todayQuery.refetch()} className="mt-2 font-bold text-primary underline underline-offset-4">Try again</button></div> : participants.length ? <div className="divide-y divide-primary/10">{participants.map((participant) => <div key={participant.id} className="list-row grid gap-2 py-4 sm:grid-cols-[32px_105px_1fr_auto] sm:items-center sm:gap-3" data-testid={`row-home-participant-${participant.id}`}><span className="font-mono-ui text-[10px] font-bold text-muted-foreground">#{participant.rank}</span><span className="text-sm font-bold text-primary">{participant.displayName}</span><p className="line-clamp-2 text-sm leading-5 text-muted-foreground">&ldquo;{participant.story}&rdquo;</p><span className="font-mono-ui text-sm font-bold text-accent sm:text-right">{formatMoney(participant.runningTotalCents)}</span></div>)}</div> : <div className="border-y border-dashed border-primary/15 py-10"><p className="font-display text-2xl text-primary">Nothing has been written into today yet.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">A blank page is still a kind of record.</p></div>}
            </div>
          </div>
          <div className="ice-panel rounded-[20px] p-5 sm:p-7" data-testid="section-recent-history">
            <div className="flex items-baseline justify-between gap-3 border-b border-primary/10 pb-4">
              <h2 className="inline-flex items-center gap-2 font-display text-2xl text-primary"><BookOpen size={18} className="text-secondary" />Recently frozen</h2>
              <Link href="/archive" className="quiet-link text-xs font-bold text-muted-foreground" data-testid="link-home-archive">view all →</Link>
            </div>
            <div className="mt-3 space-y-3">
              {archiveQuery.isLoading ? [1, 2, 3].map((item) => <div key={item} className="h-[68px] animate-pulse rounded-xl bg-muted/50" />) : recentHistory.length ? recentHistory.map((item) => <Link key={item.id} href={`/archive/${item.date}`} className="frozen-card block rounded-xl p-4 transition-transform duration-200 hover:-translate-y-0.5" data-testid={`link-home-history-${item.date}`}><div className="flex items-start justify-between gap-3"><span className="font-mono-ui text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground">{formatDate(item.date)}</span><IceGlyph kind="lock" size={13} className="text-secondary" /></div><p className="mt-2 line-clamp-1 font-display text-base text-primary">{item.winnerDisplayName ?? 'No recorded winner'}</p><p className="mt-1 text-xs text-muted-foreground">{item.winningStandingCents !== null ? formatMoney(item.winningStandingCents) : 'No standing recorded'}</p></Link>) : <p className="py-8 text-sm leading-6 text-muted-foreground">The archive is still waiting for its first frozen day.</p>}
            </div>
          </div>
        </section>
        <section className="mt-8 flex items-center justify-between gap-5 rounded-[20px] border border-secondary/35 bg-secondary/15 px-5 py-5 sm:px-7">
          <div><p className="font-mono-ui text-[9px] font-bold uppercase tracking-[.2em] text-accent">Internet history</p><p className="mt-1 font-display text-xl text-primary">One day. One winner. One tiny piece of forever.</p></div>
          <IceGlyph kind="globe" size={30} className="hidden text-secondary sm:block" />
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
          <h1 className="mt-5 font-display text-[clamp(3.8rem,9vw,7rem)] leading-[.8] tracking-[-.05em] text-primary">Today&apos;s<br /><span className="inline-flex items-center gap-3 text-accent italic">evidence.<span className="ice-glyph-halo text-secondary"><IceGlyph kind="gem" size={22} /></span></span></h1>
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
              <p className="inline-flex items-center gap-1.5"><IceGlyph kind="hourglass" size={13} />freezes in</p>
              {competition && <Countdown closingTimestamp={competition.closingTimestamp} serverTime={competition.serverTime} />}
               <p className="mt-4 inline-flex items-center gap-1.5"><IceGlyph kind="cube" size={13} />highest standing <span className="font-display text-2xl text-accent">{leader ? formatMoney(leader.runningTotalCents) : '—'}</span></p>
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