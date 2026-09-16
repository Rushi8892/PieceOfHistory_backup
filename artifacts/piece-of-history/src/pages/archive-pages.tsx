import { Link, useRoute } from 'wouter';
import { Calendar, ArrowLeft, Globe, ChevronLeft, ChevronRight, LockKeyhole, Snowflake } from 'lucide-react';
import { useGetArchive, useGetArchiveDetail, useGetSiteStats } from '@workspace/api-client-react';
import { SectionKicker, SiteFooter, SiteNav, formatMoney, formatDate } from '@/components/site';
import { useState } from 'react';

export function ArchivePage() {
  const [page, setPage] = useState(1);
  const archiveQuery = useGetArchive({ page, pageSize: 12 });
  
  const response = archiveQuery.data;
  const items = response?.items ?? [];
  const pagination = response?.pagination;

  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-5 pb-20 pt-12 sm:px-8 md:pt-20">
        <div className="max-w-2xl">
          <SectionKicker>The Archive</SectionKicker>
          <h1 className="mt-5 font-display text-[clamp(3.8rem,8vw,6.5rem)] leading-[.84] tracking-[-.04em] text-primary">Frozen<br /><span className="text-accent italic">days.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground">The days that made it through the cold. Each one keeps the sentence someone thought should outlast midnight.</p>
        </div>

        <div className="mt-12">
          {archiveQuery.isLoading ? (
            <div className="divide-y divide-primary/10 border-y border-primary/10" data-testid="state-archive-loading">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-20 animate-pulse bg-muted/40" />
              ))}
            </div>
          ) : archiveQuery.error ? (
            <div className="border-y border-accent/30 bg-accent/5 px-5 py-8" data-testid="state-archive-error">
              <p className="font-display text-2xl text-primary">The archive is holding its breath.</p>
              <p className="mt-2 text-sm text-muted-foreground">We couldn&apos;t load the past right now.</p>
              <button type="button" onClick={() => void archiveQuery.refetch()} className="mt-4 text-sm font-bold text-primary underline underline-offset-4" data-testid="button-retry-archive">Try again</button>
            </div>
          ) : items.length === 0 ? (
            <div className="border-y border-dashed border-primary/20 py-12 text-center" data-testid="state-archive-empty">
              <Calendar className="mx-auto text-secondary" size={32} />
              <p className="mt-4 font-display text-3xl text-primary">No days have frozen yet.</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Every archive begins with a blank page and somebody willing to mark it.</p>
            </div>
          ) : (
            <div data-testid="data-archive-list">
              <div className="divide-y divide-primary/10 border-y border-primary/10">
                {items.map(item => (
                  <Link key={item.id} href={`/archive/${item.date}`} className="list-row group grid gap-3 py-6 transition-colors sm:grid-cols-[180px_1fr_auto] sm:items-center sm:gap-5" data-testid={`link-archive-item-${item.date}`}>
                    <span className="flex items-center gap-2 font-display text-2xl text-primary group-hover:text-accent"><Snowflake size={15} className="text-secondary" aria-hidden="true" />{formatDate(item.date)}</span>
                    <span className="text-sm text-muted-foreground">{item.winnerDisplayName ? `Won by ${item.winnerDisplayName}` : 'No pieces recorded'} <span className="text-primary/30">/</span> {item.participantCount} piece{item.participantCount !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-2 font-mono-ui text-sm font-bold text-accent"><LockKeyhole size={13} aria-hidden="true" />{item.winningStandingCents !== null ? formatMoney(item.winningStandingCents) : '—'}</span>
                  </Link>
                ))}
              </div>
              
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                   <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="grid h-10 w-10 place-items-center rounded-[6px] border border-primary/15 text-primary hover:bg-muted disabled:opacity-50" data-testid="button-archive-prev">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-mono-ui text-xs font-bold text-muted-foreground">
                    Page {page} of {pagination.totalPages}
                  </span>
                   <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} className="grid h-10 w-10 place-items-center rounded-[6px] border border-primary/15 text-primary hover:bg-muted disabled:opacity-50" data-testid="button-archive-next">
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function ArchiveDetailPage() {
  const [, params] = useRoute('/archive/:date');
  const date = params?.date ?? '';
  const statsQuery = useGetSiteStats();
  const detailQuery = useGetArchiveDetail(date);
  
  const detail = detailQuery.data;

  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10 sm:px-8 md:pt-16 lg:px-12">
        <Link href="/archive" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary" data-testid="link-back-archive">
          <ArrowLeft size={16} /> Back to archive
        </Link>
        
        <div className="mt-12">
          {detailQuery.isLoading ? (
            <div className="space-y-6" data-testid="state-archive-detail-loading">
              <div className="h-8 w-32 animate-pulse bg-muted/60" />
              <div className="h-24 animate-pulse bg-muted/60" />
              <div className="h-40 animate-pulse rounded-[24px] bg-muted/60" />
            </div>
          ) : detailQuery.error || !detail ? (
              <div className="border-y border-accent/30 bg-accent/10 p-12 text-center" data-testid="state-archive-detail-error">
              <p className="font-display text-2xl text-primary">Page not found.</p>
              <p className="mt-2 text-sm text-muted-foreground">This day may not have been recorded or hasn&apos;t closed yet.</p>
            </div>
          ) : (
            <article data-testid="data-archive-detail">
              <SectionKicker>Piece No. {detail.id.slice(0, 6)}</SectionKicker>
              <h1 className="mt-4 font-display text-[clamp(3rem,6vw,5rem)] leading-none text-primary">{formatDate(detail.date)}</h1>
              
               <div className="mt-8 grid gap-5 border-y border-primary/10 py-6 sm:grid-cols-3">
                <div>
                  <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">Winner</p>
                  <p className="mt-1 text-sm font-bold text-primary">{detail.winnerDisplayName}</p>
                </div>
                {detail.winningStandingCents !== null && (
                  <div>
                    <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">Winning standing</p>
                    <p className="mt-1 text-sm font-bold text-primary">{formatMoney(detail.winningStandingCents)}</p>
                  </div>
                )}
                <div>
                  <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">Total pieces</p>
                  <p className="mt-1 text-sm font-bold text-primary">{detail.participantCount}</p>
                </div>
              </div>

               <div className="mt-12 border-y border-primary/10 bg-card/35 px-1 py-9 md:px-5 md:py-12">
                 <p className="story-lines whitespace-pre-line pb-2 font-display text-2xl leading-[1.6] text-primary/90 md:text-3xl" data-testid="text-archive-winning-story">
                  “{detail.winningStory}”
                </p>
              </div>

              {detail.winnerWebsiteUrl && (
                <div className="mt-12 text-center">
                   <a href={detail.winnerWebsiteUrl} target="_blank" rel="noopener noreferrer" className="quiet-link inline-flex min-h-12 items-center justify-center gap-2 text-sm font-bold tracking-tight text-primary" data-testid="link-archive-winner-website">
                    <Globe size={16} /> Visit the winner&apos;s website
                  </a>
                </div>
              )}
            </article>
          )}
        </div>
      </main>
      <SiteFooter stats={statsQuery.data} />
    </div>
  );
}
