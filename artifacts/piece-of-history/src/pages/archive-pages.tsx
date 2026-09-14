import { Link, useRoute } from 'wouter';
import { Calendar, ArrowLeft, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGetArchive, useGetArchiveDetail, useGetSiteStats } from '@workspace/api-client-react';
import { SectionKicker, SiteFooter, SiteNav, PrimaryButton, formatMoney, formatDate } from '@/components/site';
import { useState } from 'react';

export function ArchivePage() {
  const statsQuery = useGetSiteStats();
  const [page, setPage] = useState(1);
  const archiveQuery = useGetArchive({ page, pageSize: 12 });
  
  const response = archiveQuery.data;
  const items = response?.items ?? [];
  const pagination = response?.pagination;

  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8 md:pt-24 lg:px-12">
        <div className="max-w-3xl">
          <SectionKicker>The Archive</SectionKicker>
          <h1 className="mt-6 font-display text-[clamp(4rem,8vw,7.5rem)] leading-[.84] tracking-[-.04em] text-primary">All the days<br /><span className="text-accent italic">we kept.</span></h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">Every day that has passed is stored here, forever. Look back at what mattered to someone else, on a day just like today.</p>
        </div>

        <div className="mt-16">
          {archiveQuery.isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="state-archive-loading">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-40 animate-pulse rounded-[24px] bg-muted/60" />
              ))}
            </div>
          ) : archiveQuery.error ? (
            <div className="rounded-[24px] border border-accent/30 bg-accent/10 p-12 text-center" data-testid="state-archive-error">
              <p className="font-display text-2xl text-primary">The archive is resting.</p>
              <p className="mt-2 text-sm text-muted-foreground">We couldn&apos;t load the past right now.</p>
              <button type="button" onClick={() => void archiveQuery.refetch()} className="mt-6 text-sm font-bold text-primary underline underline-offset-4" data-testid="button-retry-archive">Try again</button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-primary/20 bg-card p-16 text-center" data-testid="state-archive-empty">
              <Calendar className="mx-auto text-secondary" size={32} />
              <p className="mt-6 font-display text-3xl text-primary">The archive is empty.</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Tomorrow, this space will hold its first piece of history.</p>
            </div>
          ) : (
            <div data-testid="data-archive-list">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {items.map(item => (
                  <Link key={item.id} href={`/archive/${item.date}`} className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-primary/10 bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md" data-testid={`link-archive-item-${item.date}`}>
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">No. {item.id.slice(0, 6)}</span>
                        {item.winningStandingCents !== null && (
                          <span className="rounded-full bg-secondary/35 px-3 py-1 font-mono-ui text-[10px] font-bold tracking-wide text-primary">{formatMoney(item.winningStandingCents)}</span>
                        )}
                      </div>
                      <h3 className="mt-4 font-display text-2xl leading-tight text-primary transition-colors group-hover:text-accent">{formatDate(item.date)}</h3>
                    </div>
                    <div className="mt-10 border-t border-primary/10 pt-5 text-sm text-primary/80">
                      {item.winnerDisplayName ? (
                        <p className="font-semibold"><span className="text-muted-foreground font-normal">Won by</span> {item.winnerDisplayName}</p>
                      ) : (
                        <p className="italic text-muted-foreground">No pieces recorded</p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">{item.participantCount} piece{item.participantCount !== 1 ? 's' : ''} total</p>
                    </div>
                  </Link>
                ))}
              </div>
              
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="grid h-10 w-10 place-items-center rounded-full border border-primary/15 text-primary hover:bg-muted disabled:opacity-50" data-testid="button-archive-prev">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-mono-ui text-xs font-bold text-muted-foreground">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} className="grid h-10 w-10 place-items-center rounded-full border border-primary/15 text-primary hover:bg-muted disabled:opacity-50" data-testid="button-archive-next">
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <SiteFooter stats={statsQuery.data} />
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
            <div className="rounded-[24px] border border-accent/30 bg-accent/10 p-12 text-center" data-testid="state-archive-detail-error">
              <p className="font-display text-2xl text-primary">Page not found.</p>
              <p className="mt-2 text-sm text-muted-foreground">This day may not have been recorded or hasn&apos;t closed yet.</p>
            </div>
          ) : (
            <article data-testid="data-archive-detail">
              <SectionKicker>Piece No. {detail.id.slice(0, 6)}</SectionKicker>
              <h1 className="mt-4 font-display text-[clamp(3rem,6vw,5rem)] leading-none text-primary">{formatDate(detail.date)}</h1>
              
              <div className="mt-8 flex flex-wrap items-center gap-6 border-y border-primary/10 py-6">
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

              <div className="mt-12 rounded-[24px] border border-primary/10 bg-card p-8 md:p-12 shadow-sm">
                <p className="story-lines whitespace-pre-line pb-2 font-display text-2xl leading-[1.6] text-primary/90 md:text-3xl" data-testid="text-archive-winning-story">
                  “{detail.winningStory}”
                </p>
              </div>

              {detail.winnerWebsiteUrl && (
                <div className="mt-12 text-center">
                  <a href={detail.winnerWebsiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-bold tracking-tight text-primary-foreground shadow-[4px_4px_0_hsl(var(--secondary))] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[5px_6px_0_hsl(var(--secondary))]" data-testid="link-archive-winner-website">
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
