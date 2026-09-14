import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, Clock3, ExternalLink, Menu, PenLine, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import type { CompetitionParticipant, SiteStats, TodayCompetition } from '@workspace/api-client-react';
import { getGetCurrentUserQueryKey, useGetCurrentUser } from '@workspace/api-client-react';
import { Show, useAuth } from '@clerk/react';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" data-testid="link-logo">
      <span
        className={`grid h-10 w-10 place-items-center rounded-[13px] border-2 ${
          light ? 'border-secondary bg-secondary text-primary' : 'border-primary bg-primary text-secondary'
        } shadow-[3px_3px_0_hsl(var(--secondary)/.8)] transition-transform duration-200 group-hover:-translate-y-0.5`}
        aria-hidden="true"
      >
        <span className="font-display text-[27px] leading-none">P</span>
      </span>
      <span className={`font-display text-[25px] leading-none tracking-tight ${light ? 'text-white' : 'text-primary'}`}>
        Piece of History
      </span>
    </Link>
  );
}

export function PrimaryButton({
  children,
  href,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  testId,
  disabled = false,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'quiet' | 'light';
  className?: string;
  testId: string;
  disabled?: boolean;
}) {
  const styles = {
    primary: 'bg-primary text-primary-foreground shadow-[4px_4px_0_hsl(var(--secondary))] hover:-translate-y-0.5 hover:shadow-[5px_6px_0_hsl(var(--secondary))] disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_hsl(var(--secondary))]',
    quiet: 'border border-primary/15 bg-card text-primary hover:border-primary/40 hover:bg-muted disabled:hover:border-primary/15 disabled:hover:bg-card',
    light: 'bg-secondary text-primary shadow-[4px_4px_0_hsl(var(--primary)/.25)] hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_hsl(var(--primary)/.25)]',
  }[variant];
  const classes = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold tracking-[-.01em] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`;

  if (href) {
    return <Link href={href} className={classes} data-testid={testId}>{children}</Link>;
  }

  return <button type={type} onClick={onClick} disabled={disabled} className={classes} data-testid={testId}>{children}</button>;
}

export function SiteNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const { data: user } = useGetCurrentUser({
    query: {
      enabled: isLoaded && isSignedIn,
      queryKey: getGetCurrentUserQueryKey(),
      retry: false,
    },
  });
  const isActive = (path: string) => path === '/' ? location === '/' : location.startsWith(path);
  const links = [
    { href: '/explore', label: 'Explore' },
    { href: '/archive', label: 'Archive' },
    { href: '/competition', label: 'Today' },
    { href: '/how-it-works', label: 'How it works' },
  ];

  return (
    <header className="relative z-20 border-b border-primary/10 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link text-sm font-semibold" data-active={isActive(link.href)} data-testid={`link-nav-${link.label.toLowerCase().replaceAll(' ', '-')}`}>
              {link.label}
            </Link>
          ))}
          <Show when="signed-in">
            <Link href="/my-history" className="nav-link text-sm font-semibold" data-active={isActive('/my-history')} data-testid="link-nav-my-history">
              My History
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin" className="nav-link text-sm font-semibold" data-active={isActive('/admin')} data-testid="link-nav-admin">
                Admin
              </Link>
            )}
          </Show>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Show when="signed-out">
            <Link href="/sign-in" className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary" data-testid="link-sign-in">
              Sign in
            </Link>
            <PrimaryButton href="/sign-up" testId="button-start-writing">Start writing <ArrowUpRight size={16} /></PrimaryButton>
          </Show>
          <Show when="signed-in">
            <PrimaryButton href="/participate" testId="button-start-writing-auth">Start writing <ArrowUpRight size={16} /></PrimaryButton>
          </Show>
        </div>
        <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-primary/15 text-primary md:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close menu' : 'Open menu'} data-testid="button-mobile-menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="absolute inset-x-0 top-full border-b border-primary/10 bg-background px-5 pb-5 shadow-lg md:hidden">
          <nav className="flex flex-col gap-1 pt-2" aria-label="Mobile navigation">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-primary hover:bg-muted" data-testid={`link-mobile-${link.label.toLowerCase().replaceAll(' ', '-')}`}>
                {link.label}
              </Link>
            ))}
            <Show when="signed-in">
              <Link href="/my-history" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-primary hover:bg-muted" data-testid="link-mobile-my-history">
                My History
              </Link>
              {user?.role === 'admin' && (
                <Link href="/admin" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-primary hover:bg-muted" data-testid="link-mobile-admin">
                  Admin
                </Link>
              )}
            </Show>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-primary/10 pt-4">
              <Show when="signed-out">
                <Link href="/sign-in" className="rounded-full border border-primary/15 px-4 py-3 text-center text-sm font-semibold text-primary" data-testid="link-mobile-sign-in">Sign in</Link>
                <Link href="/sign-up" className="rounded-full bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground" data-testid="link-mobile-sign-up">Start writing</Link>
              </Show>
              <Show when="signed-in">
                <Link href="/participate" className="col-span-2 rounded-full bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground" data-testid="link-mobile-participate">Start writing</Link>
              </Show>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter({ stats }: { stats?: SiteStats }) {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-7 max-w-xs text-sm leading-6 text-primary-foreground/65">
              A tiny side project — one story wins the day, every day, frozen in the archive forever.
            </p>
          </div>
          <div>
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.22em] text-secondary">Find your way</p>
            <div className="mt-5 flex flex-col items-start gap-3 text-sm text-primary-foreground/70">
              <Link href="/explore" className="transition-colors hover:text-secondary" data-testid="footer-link-explore">Explore stories</Link>
              <Link href="/archive" className="transition-colors hover:text-secondary" data-testid="footer-link-archive">The Archive</Link>
              <Link href="/competition" className="transition-colors hover:text-secondary" data-testid="footer-link-competition">Today&apos;s competition</Link>
              <Link href="/how-it-works" className="transition-colors hover:text-secondary" data-testid="footer-link-how-it-works">How it works</Link>
            </div>
          </div>
          <div>
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.22em] text-secondary">The living count</p>
            <p className="mt-5 text-sm leading-6 text-primary-foreground/70">
              {stats
                ? `${stats.daysLaunched.toLocaleString()} days launched · ${stats.users.toLocaleString()} people · ${stats.piecesOfHistory.toLocaleString()} completed pieces`
                : 'The archive is loading.'}
            </p>
            <Show when="signed-out">
              <Link href="/sign-up" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-secondary hover:underline" data-testid="footer-link-join">
                Add yours <ArrowUpRight size={15} />
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/participate" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-secondary hover:underline" data-testid="footer-link-participate">
                Add yours <ArrowUpRight size={15} />
              </Link>
            </Show>
          </div>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-3 border-t border-primary-foreground/15 pt-5 text-xs text-primary-foreground/45 sm:flex-row">
          <span>© {new Date().getFullYear()} Piece of History</span>
          <span>A side project · Built by something curious · For the days worth remembering.</span>
        </div>
      </div>
    </footer>
  );
}

export function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string) {
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00`) : new Date(date);
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(parsedDate);
}

export function StoryCard({ participant, featured = false }: { participant: CompetitionParticipant; featured?: boolean }) {
  const hasWebsite = Boolean(participant.websiteUrl);
  return (
    <article className={`group relative overflow-hidden rounded-[24px] border border-primary/10 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${featured ? 'md:p-8' : ''}`} data-testid={`card-story-${participant.id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-muted font-mono-ui text-xs font-bold text-primary">{participant.displayName.slice(0, 1).toUpperCase()}</span>
          <div>
            <p className="text-sm font-bold text-primary" data-testid={`text-story-author-${participant.id}`}>{participant.displayName}</p>
            <p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">Rank {participant.rank}</p>
          </div>
        </div>
        <span className="rounded-full bg-secondary/35 px-3 py-1 font-mono-ui text-[10px] font-bold tracking-wide text-primary">{formatMoney(participant.runningTotalCents)}</span>
      </div>
      <p className={`story-lines mt-6 whitespace-pre-line pb-1 font-display leading-[1.5] text-primary/90 ${featured ? 'text-2xl md:text-[29px]' : 'text-xl'}`} data-testid={`text-story-content-${participant.id}`}>
        “{participant.story}”
      </p>
      <div className="mt-7 flex items-center justify-between gap-3 border-t border-primary/10 pt-4">
        <span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground">A piece of history</span>
        {hasWebsite && (
          <a href={participant.websiteUrl ?? undefined} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-2 font-bold transition-colors ${featured ? 'min-h-12 rounded-full bg-primary px-6 text-sm text-primary-foreground hover:bg-primary/90' : 'rounded-full border border-primary/15 px-4 py-2 text-xs text-primary hover:border-primary/40'}`} data-testid={`link-story-website-${participant.id}`}>
            Visit Website <ExternalLink size={featured ? 15 : 13} />
          </a>
        )}
      </div>
    </article>
  );
}

export function Countdown({ closingTimestamp, serverTime }: { closingTimestamp: string; serverTime?: string }) {
  const getClockSkew = () => serverTime ? new Date(serverTime).getTime() - Date.now() : 0;
  const getRemaining = () => Math.max(0, new Date(closingTimestamp).getTime() - (Date.now() + getClockSkew()));
  const [remaining, setRemaining] = useState(getRemaining);
  useEffect(() => {
    const interval = window.setInterval(() => setRemaining(getRemaining()), 1000);
    setRemaining(getRemaining());
    return () => window.clearInterval(interval);
  }, [closingTimestamp, serverTime]);
  const time = useMemo(() => {
    const totalSeconds = Math.floor(remaining / 1000);
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  }, [remaining]);
  const unit = (value: number) => String(value).padStart(2, '0');

  return (
    <div className="flex items-center gap-2" data-testid="countdown-timer">
      <Clock3 size={16} className="text-secondary" />
      <span className="font-mono-ui text-sm font-bold tracking-wide text-primary-foreground">
        {remaining > 0 ? `${unit(time.hours)}:${unit(time.minutes)}:${unit(time.seconds)}` : 'Closed for today'}
      </span>
    </div>
  );
}

export function TodayData({
  competition,
  loading,
  error,
  onRetry,
  compact = false,
}: {
  competition?: TodayCompetition;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  compact?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4" data-testid="state-competition-loading">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-36 animate-pulse rounded-[24px] bg-muted" />
      </div>
    );
  }
  if (error || !competition) {
    return (
      <div className="rounded-[24px] border border-accent/30 bg-accent/10 p-6" data-testid="state-competition-error">
        <p className="font-display text-2xl text-primary">The story desk is taking a breath.</p>
        <p className="mt-2 text-sm text-muted-foreground">We couldn&apos;t load today&apos;s pieces just now.</p>
        <button type="button" onClick={onRetry} className="mt-4 text-sm font-bold text-primary underline underline-offset-4" data-testid="button-retry-competition">Try again</button>
      </div>
    );
  }
  const participants = competition.participants ?? [];
  return (
    <div className="space-y-5" data-testid="data-today-competition">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">Live today</p>
            <h2 className="mt-2 font-display text-4xl leading-none text-primary">{formatDate(competition.date)}</h2>
          </div>
          <div className="rounded-full bg-primary px-4 py-2">
            <Countdown closingTimestamp={competition.closingTimestamp} serverTime={competition.serverTime} />
          </div>
        </div>
      )}
      {participants.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-primary/20 bg-card p-8 text-center" data-testid="state-competition-empty">
          <PenLine className="mx-auto text-secondary" size={25} />
          <p className="mt-4 font-display text-2xl text-primary">The page is still blank.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Be the first person to leave a mark on today. The first sentence is always the hardest.</p>
          <Show when="signed-out">
            <PrimaryButton href="/sign-up" className="mt-5" testId="button-empty-start-writing">Write today&apos;s piece <ArrowUpRight size={16} /></PrimaryButton>
          </Show>
          <Show when="signed-in">
            <PrimaryButton href="/participate" className="mt-5" testId="button-empty-participate">Write today&apos;s piece <ArrowUpRight size={16} /></PrimaryButton>
          </Show>
        </div>
      ) : (
        <div className="space-y-4">
          {participants.slice(0, compact ? 3 : undefined).map((participant) => <StoryCard key={participant.id} participant={participant} featured={!compact && participant.rank === 1} />)}
        </div>
      )}
    </div>
  );
}

export function SectionKicker({ children }: { children: ReactNode }) {
  return <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.24em] text-accent">{children}</p>;
}

export function StatStrip({ stats, loading }: { stats?: SiteStats; loading: boolean }) {
  const statItems = [
    { value: stats?.daysLaunched, label: 'days of showing up' },
    { value: stats?.users, label: 'people with a story' },
    { value: stats?.piecesOfHistory, label: 'pieces of history' },
  ];
  return (
    <div className="grid grid-cols-1 divide-y divide-primary-foreground/15 border-y border-primary-foreground/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0" data-testid="stats-strip">
      {statItems.map((item) => (
        <div key={item.label} className="flex items-baseline gap-3 px-0 py-5 sm:flex-col sm:gap-1 sm:px-7 sm:py-6 first:sm:pl-0 last:sm:pr-0">
          <span className="font-display text-4xl text-secondary" data-testid={`stat-value-${item.label.replaceAll(' ', '-')}`}>{loading ? '—' : (item.value ?? 0).toLocaleString()}</span>
          <span className="text-sm text-primary-foreground/60">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function StoryMark() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px] animate-drift" aria-hidden="true">
      <div className="absolute inset-[7%] rounded-[46%_54%_48%_52%/48%_45%_55%_52%] border-2 border-primary/20 bg-secondary/30" />
      <div className="absolute inset-[18%] rounded-[54%_46%_44%_56%/45%_55%_45%_55%] border-2 border-primary/30 bg-background/70" />
      <div className="absolute inset-[29%] rounded-[40%_60%_53%_47%/54%_42%_58%_46%] bg-primary shadow-[12px_14px_0_hsl(var(--accent)/.7)]" />
      <span className="absolute left-[43%] top-[37%] font-display text-[clamp(100px,17vw,156px)] leading-none text-secondary">P</span>
      <span className="absolute -right-1 top-[11%] rounded-full border border-primary/20 bg-card px-3 py-2 font-mono-ui text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm">Your day matters</span>
      <span className="absolute bottom-[11%] -left-1 rounded-full border border-primary/20 bg-card px-3 py-2 font-mono-ui text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm">Since today</span>
    </div>
  );
}

export function HowStep({ number, title, children, icon }: { number: string; title: string; children: ReactNode; icon: ReactNode }) {
  return (
    <div className="relative border-l border-primary/15 pl-7 md:border-l-0 md:pl-0">
      <div className="flex items-center gap-3">
        <span className="font-mono-ui text-[10px] font-bold tracking-[.2em] text-accent">{number}</span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-primary">{icon}</span>
      </div>
      <h3 className="mt-6 font-display text-3xl text-primary">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{children}</p>
    </div>
  );
}

export function CheckLine({ children }: { children: ReactNode }) {
  return <li className="flex gap-3 text-sm leading-6 text-primary/80"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Check size={12} strokeWidth={3} /></span>{children}</li>;
}