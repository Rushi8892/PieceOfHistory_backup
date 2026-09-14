import { ArrowUpRight, ChevronLeft, ChevronRight, PenLine, Info, Clock, Check, X } from 'lucide-react';
import { getGetMyHistoryQueryKey, useGetCurrentUser, useGetMyHistory, useGetSiteStats } from '@workspace/api-client-react';
import { SectionKicker, SiteFooter, SiteNav, PrimaryButton, formatMoney, formatDate } from '@/components/site';
import { useState } from 'react';

export function MyHistoryPage() {
  const statsQuery = useGetSiteStats();
  const currentUserQuery = useGetCurrentUser();
  const [page, setPage] = useState(1);
  const params = { page, pageSize: 10 };
  const historyQuery = useGetMyHistory(params, {
    query: {
      enabled: Boolean(currentUserQuery.data?.id),
      queryKey: [...getGetMyHistoryQueryKey(params), currentUserQuery.data?.id],
    },
  });
  
  const response = historyQuery.data;
  const items = response?.items ?? [];
  const pagination = response?.pagination;

  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8 md:pt-24 lg:px-12">
        <div className="max-w-3xl">
          <SectionKicker>Your History</SectionKicker>
          <h1 className="mt-6 font-display text-[clamp(4rem,8vw,7.5rem)] leading-[.84] tracking-[-.04em] text-primary">Every day<br /><span className="text-accent italic">you showed up.</span></h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">A private record of your pieces of history. The days you kept, the pieces you wrote, and what it took to keep them there.</p>
        </div>

        <div className="mt-16">
          {historyQuery.isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="state-history-loading">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 animate-pulse rounded-[24px] bg-muted/60" />
              ))}
            </div>
          ) : historyQuery.error ? (
            <div className="rounded-[24px] border border-accent/30 bg-accent/10 p-12 text-center" data-testid="state-history-error">
              <p className="font-display text-2xl text-primary">Your record is resting.</p>
              <p className="mt-2 text-sm text-muted-foreground">We couldn&apos;t load your history right now.</p>
              <button type="button" onClick={() => void historyQuery.refetch()} className="mt-6 text-sm font-bold text-primary underline underline-offset-4" data-testid="button-retry-history">Try again</button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-primary/20 bg-card p-16 text-center" data-testid="state-history-empty">
              <PenLine className="mx-auto text-secondary" size={32} />
              <p className="mt-6 font-display text-3xl text-primary">No pieces yet.</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">You haven't participated in any days yet. Write your first piece today.</p>
              <PrimaryButton href="/participate" className="mt-8" testId="button-empty-participate">Start today <ArrowUpRight size={16} /></PrimaryButton>
            </div>
          ) : (
            <div data-testid="data-history-list">
              <div className="grid gap-6 md:grid-cols-2">
                {items.map(item => (
                  <div key={item.dayId} className="flex flex-col justify-between overflow-hidden rounded-[24px] border border-primary/10 bg-card p-7 shadow-sm" data-testid={`card-history-item-${item.dayId}`}>
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/10 pb-5">
                        <div>
                          <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">No. {item.dayId.slice(0, 6)}</span>
                          <h3 className="mt-1 font-display text-2xl leading-tight text-primary">{formatDate(item.date)}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.result === 'won' && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-secondary bg-secondary/20 px-3 py-1 font-mono-ui text-[10px] font-bold uppercase tracking-wider text-primary" data-testid={`badge-result-won-${item.dayId}`}>
                              <Check size={12} /> Won
                            </span>
                          )}
                          {item.result === 'lost' && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-primary/10 bg-muted px-3 py-1 font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground" data-testid={`badge-result-lost-${item.dayId}`}>
                              <X size={12} /> Lost
                            </span>
                          )}
                          {item.result === 'in_progress' && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 font-mono-ui text-[10px] font-bold uppercase tracking-wider text-accent-foreground" data-testid={`badge-result-progress-${item.dayId}`}>
                              <Clock size={12} /> In Progress
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="py-5">
                        {item.storyStatus === 'moderated' ? (
                          <div className="flex items-center gap-2 rounded-xl bg-accent/10 p-4 text-sm text-accent-foreground">
                            <Info size={16} />
                            <p>This story was hidden by moderation.</p>
                          </div>
                        ) : item.storyText ? (
                          <p className="story-lines whitespace-pre-line pb-1 font-display text-xl leading-[1.5] text-primary/90">
                            “{item.storyText}”
                          </p>
                        ) : (
                          <p className="italic text-muted-foreground">No story provided.</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 rounded-[16px] bg-muted/40 p-5">
                      <div className="flex justify-between border-b border-primary/5 pb-3">
                        <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">Final Rank</span>
                        <span className="text-sm font-bold text-primary">{item.finalRank ? `#${item.finalRank}` : '—'}</span>
                      </div>
                      <div className="flex justify-between py-3">
                        <span className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">Total Paid</span>
                        <span className="text-sm font-bold text-primary">{formatMoney(item.finalRunningTotalCents)}</span>
                      </div>
                      
                      {item.payments.length > 0 && (
                        <div className="mt-2 border-t border-primary/5 pt-3">
                          <p className="mb-2 font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">Payment History</p>
                          <ul className="space-y-2">
                            {item.payments.map((payment, idx) => (
                              <li key={idx} className="flex justify-between text-xs text-muted-foreground">
                                <span>{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(payment.capturedAt))}</span>
                                <span>{formatMoney(payment.amountCents)} ({payment.paymentReference.slice(-6)})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="grid h-10 w-10 place-items-center rounded-full border border-primary/15 text-primary hover:bg-muted disabled:opacity-50" data-testid="button-history-prev">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-mono-ui text-xs font-bold text-muted-foreground">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} className="grid h-10 w-10 place-items-center rounded-full border border-primary/15 text-primary hover:bg-muted disabled:opacity-50" data-testid="button-history-next">
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
