import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, PenLine, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import type { CompetitionParticipant, SiteStats, TodayCompetition } from '@workspace/api-client-react';
import { getGetCurrentUserQueryKey, useGetCurrentUser } from '@workspace/api-client-react';
import { Show, useAuth } from '@clerk/react';

export type IceGlyphKind = 'calendar' | 'cube' | 'globe' | 'crown' | 'page' | 'lock' | 'book' | 'hourglass' | 'clock' | 'snowflake' | 'gem' | 'profile';

const frostAssetFiles = {
  book: 'book_1789569663662.svg',
  calendar: 'calendar_1789569670561.svg',
  clock: 'clock_1789569676137.svg',
  crown: 'crown_1789569683497.svg',
  crystal: 'crystal_1789569692135.svg',
  document: 'document_1789569699588.svg',
  externalLink: 'external_link_1789569709686.svg',
  frozenBadge: 'frozen_badge_1789569718333.svg',
  globe: 'globe_1789569727549.svg',
  heart: 'heart_1789569735189.svg',
  iceCube: 'ice_cube_1789569745464.svg',
  iceMountain: 'ice_mountain_1789569646561.svg',
  leadingBadge: 'leading_badge_1789569760296.svg',
  lock: 'lock_1789569772042.svg',
  menu: 'menu_1789569780812.svg',
  penguin: 'penguin_1789569791624.svg',
  profile: 'profile_1789569802781.svg',
  search: 'search_1789569814424.svg',
  share: 'share_1789569899744.svg',
  snowflake: 'snowflake_1789569899793.svg',
  sparkle: 'sparkle_1789569899833.svg',
  trophy: 'trophy_1789569899875.svg',
  yourPieceBadge: 'your_piece_badge_1789569899932.svg',
} as const;

export function FrostAsset({
  name,
  size = 18,
  className = '',
  alt = '',
}: {
  name: keyof typeof frostAssetFiles;
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    <span
      className={`frost-asset ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={alt ? undefined : true}
    >
      <img
        src={`${import.meta.env.BASE_URL}assets/${frostAssetFiles[name]}`}
        alt={alt}
      />
    </span>
  );
}

export function IceGlyph({ kind, size = 18, className = '' }: { kind: IceGlyphKind; size?: number; className?: string }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.35,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
      {...common}
    >
      {kind === 'calendar' && (
        <>
          <rect x="4.5" y="5.5" width="15" height="15" rx="2" />
          <path d="M8 3.5v4M16 3.5v4M4.5 10h15" />
          <path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" strokeWidth="2.2" />
        </>
      )}
      {kind === 'cube' && (
        <>
          <path d="m12 3.5 7.3 4.1v8.8L12 20.5l-7.3-4.1V7.6L12 3.5Z" />
          <path d="m4.7 7.6 7.3 4.1 7.3-4.1M12 11.7v8.8" />
        </>
      )}
      {kind === 'globe' && (
        <>
          <circle cx="12" cy="12" r="8.2" />
          <path d="M3.8 12h16.4M12 3.8c2.1 2.2 3.1 5 3.1 8.2s-1 6-3.1 8.2M12 3.8c-2.1 2.2-3.1 5-3.1 8.2s1 6 3.1 8.2" />
        </>
      )}
      {kind === 'crown' && (
        <>
          <path d="m4 7 4 3 4-6 4 6 4-3-1.3 10H5.3L4 7Z" />
          <path d="M6 20h12M6.2 14.5h11.6" />
        </>
      )}
      {kind === 'page' && (
        <>
          <path d="M6 3.5h8l4 4v13H6z" />
          <path d="M14 3.5v4h4M8.5 12h7M8.5 15.5h7M8.5 9h2" />
        </>
      )}
      {kind === 'lock' && (
        <>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7.5a4 4 0 0 1 8 0V10M12 14v2.5" />
        </>
      )}
      {kind === 'book' && (
        <>
          <path d="M4.5 5.5a3 3 0 0 1 3-3H12v17H7.5a3 3 0 0 0-3 3v-17Z" />
          <path d="M19.5 5.5a3 3 0 0 0-3-3H12v17h4.5a3 3 0 0 1 3 3v-17ZM7.5 6.5h2M14.5 6.5h2" />
        </>
      )}
      {kind === 'hourglass' && (
        <>
          <path d="M7 4h10M7 20h10M8 4c0 3.2 1.3 4.4 4 6 2.7-1.6 4-2.8 4-6M8 20c0-3.2 1.3-4.4 4-6 2.7 1.6 4 2.8 4 6" />
          <path d="M10.2 12h3.6" />
        </>
      )}
      {kind === 'clock' && (
        <>
          <circle cx="12" cy="12" r="8.2" />
          <path d="M12 7.5v5l3.3 2" />
        </>
      )}
      {kind === 'snowflake' && (
        <>
          <path d="M12 3v18M4.2 7.5 19.8 16.5M4.2 16.5 19.8 7.5" />
          <path d="m12 3-1.8 2M12 3l1.8 2M12 21l-1.8-2M12 21l1.8-2M4.2 7.5l2.5.2M4.2 7.5l.9 2.4M19.8 16.5l-2.5-.2M19.8 16.5l-.9-2.4M4.2 16.5l2.5-.2M4.2 16.5l.9-2.4M19.8 7.5l-2.5.2M19.8 7.5l-.9 2.4" />
        </>
      )}
      {kind === 'gem' && (
        <>
          <path d="m4 8 4-4h8l4 4-8 12L4 8Z" />
          <path d="m4 8h16M8 4l4 4 4-4M8 8l4 12 4-12" />
        </>
      )}
      {kind === 'profile' && (
        <>
          <circle cx="12" cy="12" r="8.2" />
          <circle cx="12" cy="9.2" r="2.1" />
          <path d="M7.8 17c.9-2.1 2.3-3.1 4.2-3.1s3.3 1 4.2 3.1" />
        </>
      )}
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-3" data-testid="link-logo">
      <img
        src={`${import.meta.env.BASE_URL}piece-of-history-logo.png`}
        alt=""
        className={`h-9 w-9 rounded-[9px] border-2 object-cover shadow-[3px_3px_0_hsl(var(--secondary)/.8)] transition-transform duration-200 group-hover:-translate-y-0.5 ${light ? 'border-secondary' : 'border-primary/20'}`}
      />
      <span className="flex flex-col">
        <span className={`font-display text-[20px] leading-none tracking-tight ${light ? 'text-white' : 'text-primary'}`}>
          Piece of History
        </span>
        <span className={`mt-1 inline-flex whitespace-nowrap items-center gap-1 font-mono-ui text-[8px] uppercase tracking-[.16em] ${light ? 'text-primary-foreground/55' : 'text-muted-foreground'}`}>
          <FrostAsset name="globe" size={12} className="frost-asset-plain frost-asset-inline" /> Piece of Internet History
        </span>
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
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[6px] px-5 text-sm font-bold tracking-[-.01em] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`;

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
    { href: '/competition', label: 'Today' },
    { href: '/explore', label: 'Explore' },
    { href: '/archive', label: 'Archive' },
    { href: '/how-it-works', label: 'How it works' },
  ];

  return (
    <header className="nav-ice relative z-20 border-b border-primary/10">
      <div className="mx-auto flex h-[60px] max-w-[1120px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
          <nav className="hidden items-center gap-4 sm:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link text-[11px] font-semibold" data-active={link.href === '/competition' ? location === '/' || isActive(link.href) : isActive(link.href)} data-testid={`link-nav-${link.label.toLowerCase().replaceAll(' ', '-')}`}>
              {link.label}
            </Link>
          ))}
          <Link href="/my-history" className="nav-link text-[11px] font-semibold" data-active={isActive('/my-history')} data-testid="link-nav-my-history">
            My History
          </Link>
          <Show when="signed-in">
            {user?.role === 'admin' && (
              <Link href="/admin" className="nav-link text-[11px] font-semibold" data-active={isActive('/admin')} data-testid="link-nav-admin">
                Admin
              </Link>
            )}
          </Show>
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Show when="signed-out">
            <PrimaryButton href="/sign-up" testId="button-start-writing">Start writing <ArrowUpRight size={16} /></PrimaryButton>
          </Show>
          <Show when="signed-in">
            <PrimaryButton href="/participate" testId="button-start-writing-auth">Start writing <ArrowUpRight size={16} /></PrimaryButton>
          </Show>
        </div>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-[6px] border border-primary/15 text-primary sm:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close menu' : 'Open menu'} data-testid="button-mobile-menu">
          {open ? <X size={20} /> : <FrostAsset name="menu" size={21} className="frost-asset-plain" />}
        </button>
      </div>
      {open && (
          <div className="absolute inset-x-0 top-full border-b border-primary/10 bg-card/95 px-5 pb-5 shadow-[0_18px_30px_-24px_hsl(var(--primary)/.55)] backdrop-blur-xl sm:hidden">
          <nav className="flex flex-col gap-1 pt-2" aria-label="Mobile navigation">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-primary hover:bg-muted" data-testid={`link-mobile-${link.label.toLowerCase().replaceAll(' ', '-')}`}>
                {link.label}
              </Link>
            ))}
             <Link href="/my-history" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-primary hover:bg-muted" data-testid="link-mobile-my-history">
               My History
             </Link>
             <Show when="signed-in">
              {user?.role === 'admin' && (
                <Link href="/admin" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-primary hover:bg-muted" data-testid="link-mobile-admin">
                  Admin
                </Link>
              )}
            </Show>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-primary/10 pt-4">
              <Show when="signed-out">
                <Link href="/sign-in" className="rounded-[6px] border border-primary/15 px-4 py-3 text-center text-sm font-semibold text-primary" data-testid="link-mobile-sign-in">Sign in</Link>
                <Link href="/sign-up" className="rounded-[6px] bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground" data-testid="link-mobile-sign-up">Start writing</Link>
              </Show>
              <Show when="signed-in">
                <Link href="/participate" className="col-span-2 rounded-[6px] bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground" data-testid="link-mobile-participate">Start writing</Link>
              </Show>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter({ stats: _stats }: { stats?: SiteStats }) {
  return (
    <footer className="footer-night border-t border-secondary/20">
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <Logo light />
          <span className="max-w-[22rem] text-xs leading-5 text-primary-foreground/60">Built by someone who won&apos;t be remembered.</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-primary-foreground/65">
          <Link href="/terms" className="transition-colors hover:text-secondary" data-testid="footer-link-terms">Terms</Link>
          <span aria-hidden="true" className="text-secondary/50">·</span>
          <Link href="/terms#privacy" className="transition-colors hover:text-secondary" data-testid="footer-link-privacy">Privacy</Link>
          <span aria-hidden="true" className="text-secondary/50">·</span>
          <a href="mailto:hello@pieceofhistory.app" className="transition-colors hover:text-secondary" data-testid="footer-link-contact">Contact</a>
          <span className="text-primary-foreground/45">© 2026 Piece of History</span>
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
  if (Number.isNaN(parsedDate.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(parsedDate);
}

export function StoryCard({ participant, featured = false }: { participant: CompetitionParticipant; featured?: boolean }) {
  const hasWebsite = Boolean(participant.websiteUrl);
  return (
    <article className={`ice-panel group relative overflow-hidden rounded-[18px] px-5 py-6 transition-colors duration-300 hover:bg-secondary/10 ${featured ? 'md:px-7 md:py-8' : ''}`} data-testid={`card-story-${participant.id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[6px] bg-muted text-secondary">
            <FrostAsset name="profile" size={21} className="frost-asset-quiet" />
          </span>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-primary" data-testid={`text-story-author-${participant.id}`}>
              {featured && <FrostAsset name="leadingBadge" size={16} className="frost-asset-warm" />}
              {participant.displayName}
            </p>
            <p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">Rank {participant.rank}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono-ui text-xs font-bold tracking-wide text-accent"><FrostAsset name="iceCube" size={15} className="frost-asset-compact" />{formatMoney(participant.runningTotalCents)}</span>
      </div>
      <p className={`story-lines mt-6 whitespace-pre-line pb-1 font-display leading-[1.5] text-primary/90 ${featured ? 'text-2xl md:text-[29px]' : 'text-xl'}`} data-testid={`text-story-content-${participant.id}`}>
        “{participant.story}”
      </p>
      <div className="mt-7 flex items-center justify-between gap-3 border-t border-primary/10 pt-4">
        <span className="inline-flex items-center gap-1.5 font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground"><FrostAsset name="document" size={15} className="frost-asset-compact" />A piece of history</span>
        {hasWebsite && (
            <a href={participant.websiteUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="quiet-link inline-flex items-center justify-center gap-2 text-xs font-bold text-primary transition-colors" data-testid={`link-story-website-${participant.id}`}>
            Visit Website <FrostAsset name="externalLink" size={featured ? 16 : 14} className="frost-asset-plain" />
          </a>
        )}
      </div>
    </article>
  );
}

export function Countdown({ closingTimestamp, serverTime, tone = 'dark' }: { closingTimestamp: string; serverTime?: string; tone?: 'dark' | 'light' }) {
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
    <div className={`flex items-center gap-2 ${tone === 'light' ? 'text-primary-foreground' : 'text-primary'}`} data-testid="countdown-timer">
      <FrostAsset name="clock" size={17} className={remaining > 0 ? 'frost-asset-quiet' : 'frost-asset-warm'} />
      <span className="font-mono-ui text-sm font-bold tracking-wide">
        {remaining > 0 ? `${unit(time.hours)}:${unit(time.minutes)}:${unit(time.seconds)}` : 'FROZEN'}
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
            <p className="inline-flex items-center gap-1.5 font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground"><FrostAsset name="calendar" size={14} className="frost-asset-compact" />Live today</p>
            <h2 className="mt-2 font-display text-4xl leading-none text-primary">{formatDate(competition.date)}</h2>
          </div>
          <div className="border-l border-primary/20 pl-4">
            <Countdown closingTimestamp={competition.closingTimestamp} serverTime={competition.serverTime} tone="light" />
          </div>
        </div>
      )}
      {participants.length === 0 ? (
        <div className="border-y border-dashed border-primary/20 bg-card/35 px-5 py-10 text-center" data-testid="state-competition-empty">
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

export function FrostDetail({ kind = 'sparkle', className = '' }: { kind?: 'sparkle' | 'snowflake'; className?: string }) {
  return (
    <span className={`frost-detail pointer-events-none absolute text-secondary/75 ${className}`} aria-hidden="true">
      <FrostAsset name={kind} size={20} className="frost-asset-plain" />
    </span>
  );
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
        <span className="grid h-9 w-9 place-items-center rounded-[6px] bg-secondary text-primary">{icon}</span>
      </div>
      <h3 className="mt-6 font-display text-3xl text-primary">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{children}</p>
    </div>
  );
}

export function CheckLine({ children }: { children: ReactNode }) {
  return <li className="flex gap-3 text-sm leading-6 text-primary/80"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Check size={12} strokeWidth={3} /></span>{children}</li>;
}