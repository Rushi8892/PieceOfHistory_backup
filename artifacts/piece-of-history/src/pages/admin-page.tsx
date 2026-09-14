import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { EyeOff, User, History, Check, Loader2, AlertCircle } from 'lucide-react';
import { 
  useGetAdminOverview, 
  getGetAdminOverviewQueryKey,
  useHideAdminStory,
  useGetCurrentUser,
  type AdminPayment,
  type AdminClosedDay
} from '@workspace/api-client-react';
import { SectionKicker, SiteFooter, SiteNav, PrimaryButton, formatMoney, formatDate } from '@/components/site';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function AdminPage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useGetCurrentUser();
  const [page, setPage] = useState(1);
  const overviewQuery = useGetAdminOverview({ page, pageSize: 20 }, {
    query: {
      queryKey: getGetAdminOverviewQueryKey({ page, pageSize: 20 }),
      enabled: user?.role === 'admin',
      retry: false
    }
  });

  const hideStory = useHideAdminStory();
  const [storyToHide, setStoryToHide] = useState<string | null>(null);

  const overview = overviewQuery.data;
  
  const handleHideStory = (storyId: string) => {
    hideStory.mutate({ storyId }, {
      onSuccess: () => {
        setStoryToHide(null);
        // Invalidate admin overview to reflect any changes if needed
        queryClient.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
      }
    });
  };

  // If user is loading, show loading state
  if (userLoading) {
    return (
      <div className="paper-grain min-h-[100dvh]">
        <SiteNav />
        <main className="mx-auto flex max-w-7xl items-center justify-center px-5 py-32">
          <Loader2 className="animate-spin text-primary" size={32} />
        </main>
      </div>
    );
  }

  // Not authorized state
  if (user?.role !== 'admin' || overviewQuery.error) {
    return (
      <div className="paper-grain min-h-[100dvh]">
        <SiteNav />
        <main className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8 md:pt-24 lg:px-12">
          <div className="mx-auto max-w-md rounded-[24px] border border-accent/30 bg-accent/10 p-12 text-center shadow-sm" data-testid="state-admin-unauthorized">
            <AlertCircle className="mx-auto text-accent" size={32} />
            <h1 className="mt-6 font-display text-3xl text-primary">Not Authorized</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">You do not have permission to view the administration area.</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="paper-grain min-h-[100dvh]">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8 md:pt-24 lg:px-12">
        <div className="max-w-3xl">
          <SectionKicker>System Administration</SectionKicker>
          <h1 className="mt-6 font-display text-[clamp(4rem,8vw,7.5rem)] leading-[.84] tracking-[-.04em] text-primary">Admin<br /><span className="text-accent italic">Overview.</span></h1>
        </div>

        <div className="mt-16">
          {overviewQuery.isLoading ? (
            <div className="space-y-10" data-testid="state-admin-loading">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="h-32 animate-pulse rounded-[24px] bg-muted/60" />
                <div className="h-32 animate-pulse rounded-[24px] bg-muted/60" />
              </div>
              <div className="h-96 animate-pulse rounded-[24px] bg-muted/60" />
            </div>
          ) : overview ? (
            <div className="space-y-12" data-testid="data-admin-overview">
              {/* Count Cards */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-center gap-6 rounded-[24px] border border-primary/10 bg-card p-8 shadow-sm">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-secondary/20 text-secondary">
                    <User size={28} />
                  </div>
                  <div>
                    <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">Total Users</p>
                    <p className="mt-1 font-display text-4xl text-primary">{overview.totalUsers.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 rounded-[24px] border border-primary/10 bg-card p-8 shadow-sm">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <History size={28} />
                  </div>
                  <div>
                    <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">Pieces of History</p>
                    <p className="mt-1 font-display text-4xl text-primary">{overview.totalPiecesOfHistory.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Payments Table */}
              <div>
                <h2 className="font-display text-3xl text-primary">Successful Payments</h2>
                <div className="mt-6 overflow-hidden rounded-[24px] border border-primary/10 bg-card shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm" data-testid="table-admin-payments">
                      <thead className="border-b border-primary/10 bg-muted/30">
                        <tr>
                          <th className="px-6 py-4 font-mono-ui text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">User</th>
                          <th className="px-6 py-4 font-mono-ui text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Day</th>
                          <th className="px-6 py-4 font-mono-ui text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Amount</th>
                          <th className="px-6 py-4 font-mono-ui text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Captured</th>
                          <th className="px-6 py-4 font-mono-ui text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/5">
                        {overview.capturedPayments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No payments recorded yet.</td>
                          </tr>
                        ) : (
                          overview.capturedPayments.map((payment, idx) => {
                            const storyId = (payment as any).storyId;
                            return (
                              <tr key={idx} className="transition-colors hover:bg-muted/20" data-testid={`row-admin-payment-${idx}`}>
                                <td className="px-6 py-4 font-medium text-primary">{payment.userDisplayName}</td>
                                <td className="px-6 py-4 text-primary/80">{formatDate(payment.dayDate)}</td>
                                <td className="px-6 py-4 font-mono-ui font-bold text-secondary">{formatMoney(payment.amountCents)}</td>
                                <td className="px-6 py-4 text-xs text-muted-foreground">{new Date(payment.capturedAt).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                  {storyId ? (
                                    <button 
                                      type="button" 
                                      onClick={() => setStoryToHide(storyId)}
                                      className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-white"
                                      data-testid={`button-hide-story-${storyId}`}
                                    >
                                      <EyeOff size={14} /> Hide Story
                                    </button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {overview.capturedPaymentsPagination && overview.capturedPaymentsPagination.totalPages > 1 && (
                    <div className="border-t border-primary/10 p-4">
                      <div className="flex items-center justify-center gap-4">
                        <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="text-sm font-bold text-primary disabled:opacity-50" data-testid="button-admin-payments-prev">Previous</button>
                        <span className="font-mono-ui text-xs font-bold text-muted-foreground">Page {page} of {overview.capturedPaymentsPagination.totalPages}</span>
                        <button type="button" disabled={page >= overview.capturedPaymentsPagination.totalPages} onClick={() => setPage(p => Math.min(overview.capturedPaymentsPagination.totalPages, p + 1))} className="text-sm font-bold text-primary disabled:opacity-50" data-testid="button-admin-payments-next">Next</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Closed Days Table */}
              <div>
                <h2 className="font-display text-3xl text-primary">Closed Days</h2>
                <div className="mt-6 overflow-hidden rounded-[24px] border border-primary/10 bg-card shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm" data-testid="table-admin-closed-days">
                      <thead className="border-b border-primary/10 bg-muted/30">
                        <tr>
                          <th className="px-6 py-4 font-mono-ui text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Day ID</th>
                          <th className="px-6 py-4 font-mono-ui text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Date</th>
                          <th className="px-6 py-4 font-mono-ui text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Winner</th>
                          <th className="px-6 py-4 font-mono-ui text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">Standing</th>
                          <th className="px-6 py-4 font-mono-ui text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/5">
                        {overview.closedDays.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No days have been closed yet.</td>
                          </tr>
                        ) : (
                          overview.closedDays.map((day, idx) => {
                            const storyId = (day as any).storyId;
                            return (
                              <tr key={idx} className="transition-colors hover:bg-muted/20" data-testid={`row-admin-closed-day-${day.dayId}`}>
                                <td className="px-6 py-4 font-mono-ui text-xs text-muted-foreground">{day.dayId.slice(0, 8)}...</td>
                                <td className="px-6 py-4 font-medium text-primary">{formatDate(day.date)}</td>
                                <td className="px-6 py-4 text-primary/80">{day.winnerDisplayName || <span className="italic text-muted-foreground">None</span>}</td>
                                <td className="px-6 py-4 font-mono-ui font-bold text-primary">
                                  {day.winningStandingCents !== null ? formatMoney(day.winningStandingCents) : '—'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {storyId ? (
                                    <button 
                                      type="button" 
                                      onClick={() => setStoryToHide(storyId)}
                                      className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-white"
                                      data-testid={`button-hide-day-story-${storyId}`}
                                    >
                                      <EyeOff size={14} /> Hide Story
                                    </button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <Dialog open={!!storyToHide} onOpenChange={(open) => !open && !hideStory.isPending && setStoryToHide(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Hide this story?</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              This action will permanently hide the story text for this entry. It will no longer be visible to the public or the original author.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <PrimaryButton 
              variant="quiet" 
              onClick={() => setStoryToHide(null)} 
              disabled={hideStory.isPending}
              testId="button-cancel-hide"
            >
              Cancel
            </PrimaryButton>
            <PrimaryButton 
              onClick={() => storyToHide && handleHideStory(storyToHide)}
              disabled={hideStory.isPending}
              testId="button-confirm-hide"
              className="bg-accent text-white hover:bg-accent/90"
            >
              {hideStory.isPending ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
              Confirm & Hide
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
