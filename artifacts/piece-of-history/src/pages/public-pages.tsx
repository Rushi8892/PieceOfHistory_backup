import { ArrowUpRight } from 'lucide-react';
import { Link } from 'wouter';
import { Show } from '@clerk/react';
import { getGetTodayCompetitionQueryKey, useGetArchive, useGetTodayCompetition } from '@workspace/api-client-react';
import { Countdown, FrostAsset, HowStep, PrimaryButton, SectionKicker, SiteFooter, SiteNav, formatDate, formatMoney, getArchiveDatePath } from '@/components/site';

function formatHeroDate(date?: string) {
  if (!date) return 'Today';
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00`) : new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Today';
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(parsedDate);
}

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
      <main className="mx-auto max-w-[1120px] px-4 pb-14 sm:px-6 md:pb-20 lg:px-8">
        <section className="frost-hero relative pb-5 pt-5 md:pb-7 md:pt-7">
          <div className="ice-shell hero-shell relative z-10 rounded-[14px] p-3 sm:p-4 md:p-5">
            <div className="hero-primary-grid relative z-10 grid gap-4 sm:grid-cols-[128px_1fr] sm:items-center sm:gap-5">
              <div className="hero-calendar-slot flex justify-center sm:justify-start">
                <div className="hero-calendar-wrap hero-calendar-compact">
                  <div
                    className="hero-calendar"
                    aria-label={hasValidCalendarDate ? `Today, ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(calendarDate)}` : 'Today, date loading'}
                  >
                    <span className="hero-calendar-icon" aria-hidden="true">
                      <FrostAsset name="calendar" size={21} className="frost-asset-plain" />
                    </span>
                    <span className="hero-calendar-divider" aria-hidden="true" />
                    <span className="hero-calendar-copy">
                      <span className="hero-calendar-label font-mono-ui">TODAY</span>
                      <span className="hero-calendar-date font-display text-primary">
                        {hasValidCalendarDate ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(calendarDate) : 'Date loading'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="today-copy">
                <p className="today-kicker inline-flex items-center gap-2 font-mono-ui text-[10px] font-bold uppercase tracking-[.24em] text-primary"><FrostAsset name="calendar" size={14} className="frost-asset-plain" />TODAY <span className="hidden font-normal tracking-[.12em] text-muted-foreground sm:inline">/ leave a mark</span></p>
                <h1 className="mt-1 max-w-3xl font-display text-[clamp(3rem,6vw,5.2rem)] leading-[.86] tracking-[-.045em] text-primary">{hasValidCalendarDate && today?.date ? formatHeroDate(today.date) : 'Today'}</h1>
                <p className="mt-2 max-w-xl font-display text-base italic leading-6 text-primary/70 md:text-lg">Who knows… this could be the day someone finally does it.</p>
                <div className="today-stats mt-4 grid gap-2 border-t border-primary/15 pt-3 sm:grid-cols-3 sm:gap-0">
                  <div className="ice-stat flex items-start gap-2">
                     <FrostAsset name="iceCube" size={21} className="mt-0.5 shrink-0 frost-asset-quiet" />
                    <div>
                      <p className="font-mono-ui text-[8px] font-bold uppercase tracking-[.12em] text-muted-foreground">Current bid</p>
                      <p className="mt-0.5 font-display text-2xl leading-none text-primary">{leader ? formatMoney(leader.runningTotalCents) : '—'}</p>
                    </div>
                  </div>
                  <div className="ice-stat flex items-start gap-2">
                     <FrostAsset name="profile" size={21} className="mt-0.5 shrink-0 frost-asset-quiet" />
                    <div className="min-w-0">
                      <p className="font-mono-ui text-[8px] font-bold uppercase tracking-[.12em] text-muted-foreground">Currently leading</p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-primary">{leader?.displayName ?? 'No one yet'}</p>
                    </div>
                  </div>
                  <div className="ice-stat flex items-start gap-2">
                     <FrostAsset name="clock" size={21} className="mt-0.5 shrink-0 frost-asset-quiet" />
                    <div>
                      <p className="font-mono-ui text-[8px] font-bold uppercase tracking-[.12em] text-muted-foreground">Freezes in</p>
                      <div className="mt-0.5"><Countdown closingTimestamp={today?.closingTimestamp ?? new Date().toISOString()} serverTime={today?.serverTime} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative z-10 mt-4 grid gap-4 border-t border-primary/10 pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                 <p className="inline-flex items-center gap-2 font-mono-ui text-[9px] font-bold uppercase tracking-[.18em] text-muted-foreground"><FrostAsset name="document" size={16} className="frost-asset-quiet" />Current piece</p>
                {leader ? <p className="mt-2 max-w-2xl font-display text-lg leading-7 text-primary/85">&ldquo;{leader.story}&rdquo;</p> : <p className="mt-2 font-display text-lg text-primary">The first story is still hiding.</p>}
                <p className="mt-1 text-[11px] italic text-muted-foreground">{leader ? `— ${leader.displayName}` : 'A blank page is still a kind of record.'}</p>
              </div>
              <div>
                <Show when="signed-out"><PrimaryButton href="/sign-up" className="w-full sm:w-auto" testId="button-home-make-bid"><FrostAsset name="iceCube" size={16} className="frost-asset-quiet" />Make your bid <ArrowUpRight size={14} /></PrimaryButton></Show>
                <Show when="signed-in"><PrimaryButton href="/participate" className="w-full sm:w-auto" testId="button-home-make-bid-auth"><FrostAsset name="iceCube" size={16} className="frost-asset-quiet" />Write your piece <ArrowUpRight size={14} /></PrimaryButton></Show>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-[2fr_1fr]" data-testid="section-todays-competition">
          <div className="ice-panel competition-focus relative rounded-[14px] p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3 border-b border-primary/10 pb-3">
              <h2 className="inline-flex items-center gap-2 font-display text-[1.5rem] text-primary sm:text-[1.7rem]"><FrostAsset name="crown" size={23} className="frost-asset-warm" />Today&apos;s competition</h2>
              <p className="hidden text-[8px] text-muted-foreground sm:block">Real people. Real stories. Live bids.</p>
              <Link href="/competition" className="quiet-link text-[9px] font-bold text-muted-foreground" data-testid="link-home-todays-competition">view all →</Link>
            </div>
            <div className="mt-2">
              {todayQuery.isLoading ? <div className="space-y-3 py-8"><div className="h-5 w-28 animate-pulse rounded bg-muted" /><div className="h-14 animate-pulse rounded bg-muted/60" /><div className="h-14 animate-pulse rounded bg-muted/60" /></div> : todayQuery.error ? <div className="py-8 text-sm text-muted-foreground"><p className="font-display text-2xl text-primary">The live page is out in the cold.</p><button type="button" onClick={() => void todayQuery.refetch()} className="mt-2 font-bold text-primary underline underline-offset-4">Try again</button></div> : (
                <>
                  <div className="competition-table-head grid grid-cols-[22px_62px_86px_1fr_18px] gap-2 px-2 py-2 font-mono-ui text-[8px] font-bold uppercase tracking-[.12em] text-muted-foreground">
                    <span>#</span><span>Bid</span><span>User</span><span>Story</span><span />
                  </div>
                  {participants.length ? <div className="divide-y divide-primary/10">{participants.map((participant) => <div key={participant.id} className={`list-row grid grid-cols-[22px_62px_86px_1fr_18px] items-center gap-2 px-2 py-3 ${participant.rank === 1 ? 'frost-leader rounded-[7px]' : ''}`} data-testid={`row-home-participant-${participant.id}`}>
                    <span className="font-mono-ui text-[10px] font-bold text-muted-foreground">{participant.rank}</span>
                    <span className="font-mono-ui text-[10px] font-bold text-primary">{formatMoney(participant.runningTotalCents)}</span>
                    <span className="flex min-w-0 items-center gap-1 text-[10px] font-semibold text-primary"><FrostAsset name="profile" size={13} className="shrink-0 frost-asset-compact" /><span className="truncate">{participant.displayName}</span></span>
                    <p className="line-clamp-2 text-[10px] leading-4 text-muted-foreground">&ldquo;{participant.story}&rdquo;</p>
                    <FrostAsset name={participant.rank === 1 ? 'leadingBadge' : participant.rank === 2 ? 'iceCube' : 'snowflake'} size={15} className={participant.rank === 1 ? 'frost-asset-warm' : 'frost-asset-compact'} />
                  </div>)}</div> : <div className="border-y border-dashed border-primary/15 py-8"><p className="font-display text-xl text-primary">Nothing has been written into today yet.</p><p className="mt-2 text-xs leading-5 text-muted-foreground">A blank page is still a kind of record.</p></div>}
                </>
              )}
            </div>
          </div>
          <div className="ice-panel recent-panel rounded-[14px] p-4 sm:p-5" data-testid="section-recent-history">
            <div className="flex items-baseline justify-between gap-3 border-b border-primary/10 pb-3">
              <h2 className="inline-flex items-center gap-2 font-display text-[1.35rem] text-primary"><FrostAsset name="book" size={20} className="frost-asset-quiet" />Recently frozen</h2>
              <Link href="/archive" className="quiet-link text-[9px] font-bold text-muted-foreground" data-testid="link-home-archive">View all →</Link>
            </div>
            <div className="mt-3 space-y-3">
               {archiveQuery.isLoading ? [1, 2, 3].map((item) => <div key={item} className="h-[68px] animate-pulse rounded-xl bg-muted/50" />) : recentHistory.length ? recentHistory.map((item) => <Link key={item.id} href={`/archive/${getArchiveDatePath(item.date)}`} className="frozen-card block rounded-[9px] p-3 transition-transform duration-200 hover:-translate-y-0.5" data-testid={`link-home-history-${item.date}`}><div className="flex items-start justify-between gap-2"><span className="font-mono-ui text-[8px] font-bold uppercase tracking-[.1em] text-muted-foreground">{formatDate(item.date)}</span><span className="inline-flex items-center gap-1 font-mono-ui text-[7px] font-bold uppercase tracking-[.12em] text-secondary"><FrostAsset name="lock" size={12} className="frost-asset-compact" />Frozen</span></div><p className="mt-2 line-clamp-1 font-display text-sm text-primary">{item.winnerDisplayName ?? 'No recorded winner'}</p><p className="mt-1 text-[10px] text-muted-foreground">{item.winningStandingCents !== null ? formatMoney(item.winningStandingCents) : 'No standing recorded'}</p></Link>) : <div className="frozen-card rounded-[9px] px-3 py-7"><p className="font-display text-base text-primary">No frozen days yet.</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">The archive will collect each winner here.</p></div>}
            </div>
          </div>
        </section>
        <section className="history-ribbon relative mt-6 flex items-center justify-between gap-4 rounded-[12px] border border-secondary/35 bg-secondary/15 px-4 py-4 sm:px-6" data-testid="section-internet-history">
          <div className="relative z-10 flex items-center gap-3">
            <FrostAsset name="globe" size={29} className="shrink-0 frost-asset-quiet" />
            <div>
              <p className="font-display text-lg leading-none text-primary">Internet History</p>
              <p className="mt-1 text-[10px] text-muted-foreground">One day. One winner. One tiny piece of history.</p>
            </div>
          </div>
          <p className="relative z-10 hidden max-w-[118px] text-right font-display text-[10px] italic leading-4 text-primary/60 sm:block">Some stories just deserve to stay →</p>
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
          <h1 className="mt-5 font-display text-[clamp(3.8rem,9vw,7rem)] leading-[.8] tracking-[-.05em] text-primary">Today&apos;s<br /><span className="inline-flex items-center gap-3 text-accent italic">evidence.<span className="ice-glyph-halo text-secondary"><FrostAsset name="crystal" size={25} className="frost-asset-plain" /></span></span></h1>
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
              <p className="inline-flex items-center gap-1.5"><FrostAsset name="clock" size={15} className="frost-asset-compact" />freezes in</p>
              {competition && <Countdown closingTimestamp={competition.closingTimestamp} serverTime={competition.serverTime} />}
               <p className="mt-4 inline-flex items-center gap-1.5"><FrostAsset name="iceCube" size={15} className="frost-asset-compact" />highest standing <span className="font-display text-2xl text-accent">{leader ? formatMoney(leader.runningTotalCents) : '—'}</span></p>
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
          <HowStep number="01" title="Write a day" icon={<FrostAsset name="document" size={19} className="frost-asset-plain" />}>Tell one short story about one meaningful day. Ordinary is encouraged.</HowStep>
          <HowStep number="02" title="Back a story" icon={<FrostAsset name="heart" size={19} className="frost-asset-plain" />}>Add a voluntary payment to the piece that deserves your attention.</HowStep>
          <HowStep number="03" title="Make history" icon={<FrostAsset name="trophy" size={19} className="frost-asset-plain" />}>At the closing time, the highest confirmed total wins and the day freezes.</HowStep>
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