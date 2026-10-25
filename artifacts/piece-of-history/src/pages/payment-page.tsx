import { useEffect, useState, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { 
  useGetStoryPayment, 
  useCreatePaymentOrder,
  getGetTodayCompetitionQueryKey,
  getGetSiteStatsQueryKey,
  getGetStoryPaymentQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { SiteNav, SiteFooter, PrimaryButton, SectionKicker, formatMoney } from '@/components/site';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, AlertCircle, Lock, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGetSiteStats } from '@workspace/api-client-react';
import { Checkbox } from '@/components/ui/checkbox';

const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const getPaymentSchema = (minCents: number) => z.object({
  amountDollars: z.string().refine(val => {
    const num = parseFloat(val);
    if (isNaN(num)) return false;
    return Math.round(num * 100) >= minCents;
  }, `Amount must be at least ${formatMoney(minCents)}`)
});

export function PaymentPage() {
  const params = useParams();
  const storyId = params.storyId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const statsQuery = useGetSiteStats();

  const [waitingForVerification, setWaitingForVerification] = useState(false);
  const [verificationTimedOut, setVerificationTimedOut] = useState(false);
  const [paymentAcknowledged, setPaymentAcknowledged] = useState(false);
  const [addingAnother, setAddingAnother] = useState(false);
  const [razorpayError, setRazorpayError] = useState<string | null>(null);

  const paymentQuery = useGetStoryPayment(storyId || '', {
    query: {
      enabled: !!storyId,
      refetchInterval: waitingForVerification ? 2000 : false,
      queryKey: getGetStoryPaymentQueryKey(storyId || ''),
    }
  });

  const createOrder = useCreatePaymentOrder();

  const context = paymentQuery.data;
  const minCents = context?.minimumPaymentCents || 100;

  useEffect(() => {
    if (!waitingForVerification) return;
    const timeout = window.setTimeout(() => {
      setWaitingForVerification(false);
      setVerificationTimedOut(true);
    }, 60_000);
    return () => window.clearTimeout(timeout);
  }, [waitingForVerification]);
  
  const paymentSchema = getPaymentSchema(minCents);
  
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amountDollars: (minCents / 100).toFixed(2) }
  });

  // Effect to handle capture completion
  useEffect(() => {
    if (
      context?.paymentStatus === 'captured' &&
      (waitingForVerification || verificationTimedOut)
    ) {
      setWaitingForVerification(false);
      setVerificationTimedOut(false);
      setAddingAnother(false);
      queryClient.invalidateQueries({ queryKey: getGetTodayCompetitionQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetSiteStatsQueryKey() });
      toast({
        title: 'Payment successful',
        description: 'Your piece has been added to the archive.',
      });
    }
  }, [waitingForVerification, verificationTimedOut, context?.paymentStatus, queryClient, toast]);

  // Effect to sync default value when context loads
  useEffect(() => {
    if (context?.minimumPaymentCents && !form.formState.isDirty) {
      form.setValue('amountDollars', (context.minimumPaymentCents / 100).toFixed(2));
    }
  }, [context?.minimumPaymentCents, form]);

  const waitingForVerificationRef = useRef(waitingForVerification);
  useEffect(() => {
    waitingForVerificationRef.current = waitingForVerification;
  }, [waitingForVerification]);

  const onPay = async (values: z.infer<typeof paymentSchema>) => {
    if (!storyId) return;
    setRazorpayError(null);
    
    const amountCents = Math.round(parseFloat(values.amountDollars) * 100);

    const isLoaded = await loadRazorpay();
    if (!isLoaded) {
      setRazorpayError('Could not load payment gateway. Please check your connection.');
      return;
    }

    createOrder.mutate({ data: { storyId, amountCents } }, {
      onSuccess: (order) => {
        // Optimistically set status to pending so we don't accidentally read an old 'captured' state
        queryClient.setQueryData(getGetStoryPaymentQueryKey(storyId), (old: any) => 
          old ? { ...old, paymentStatus: 'pending' } : old
        );

        const options = {
          key: order.keyId,
          amount: order.amountCents,
          currency: order.currency,
          name: "Piece of History",
          description: "Story Support",
          order_id: order.orderId,
          handler: function () {
            setWaitingForVerification(true);
          },
          modal: {
            ondismiss: function() {
              if (!waitingForVerificationRef.current) {
                toast({
                  title: "Payment cancelled",
                  description: "You closed the payment window. You can try again when you are ready.",
                });
              }
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setRazorpayError(response.error.description || 'Payment failed');
        });
        rzp.open();
      },
      onError: () => {
        setRazorpayError('Could not create payment order. Please try again later.');
      }
    });
  };

  const isCaptured = context?.paymentStatus === 'captured' && !addingAnother;

  return (
    <div className="paper-grain min-h-[100dvh] flex flex-col">
      <SiteNav />
      
      <main className="flex-1 flex flex-col justify-center items-center px-5 py-12 sm:px-8">
        
        {paymentQuery.isLoading ? (
          <div className="flex flex-col items-center gap-4 text-primary" data-testid="state-payment-loading">
            <Loader2 className="animate-spin" size={32} />
            <p className="font-mono-ui text-sm uppercase tracking-wider">Preparing desk...</p>
          </div>
        ) : paymentQuery.isError || !context ? (
          <div className="rounded-[24px] border border-accent/30 bg-accent/10 p-8 max-w-md w-full text-center" data-testid="state-payment-error">
            <AlertCircle className="mx-auto text-accent mb-4" size={32} />
            <p className="font-display text-2xl text-primary">Could not open payment</p>
            <p className="mt-2 text-sm text-muted-foreground">We couldn't retrieve the payment context. Please try again.</p>
            <PrimaryButton onClick={() => paymentQuery.refetch()} variant="quiet" className="mt-6" testId="button-retry-payment">
              Retry
            </PrimaryButton>
          </div>
        ) : waitingForVerification ? (
          <div className="rounded-[30px] border border-primary/10 bg-card p-10 max-w-md w-full text-center shadow-lg animate-rise-in" data-testid="state-payment-verifying">
            <RefreshCw className="mx-auto text-secondary animate-spin mb-6" size={40} />
            <h2 className="font-display text-4xl text-primary leading-none">Verifying</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              We are confirming your contribution. This should only take a moment.
            </p>
          </div>
        ) : verificationTimedOut ? (
          <div className="rounded-[30px] border border-primary/10 bg-card p-10 max-w-md w-full text-center shadow-lg animate-rise-in" data-testid="state-payment-verification-timeout">
            <AlertCircle className="mx-auto text-secondary mb-6" size={40} />
            <h2 className="font-display text-3xl text-primary leading-tight">Still confirming</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Your payment may still be confirming. Please do not pay again. Check My History later to see its status.
            </p>
            <PrimaryButton
              onClick={() => {
                setVerificationTimedOut(false);
                setWaitingForVerification(true);
                void paymentQuery.refetch();
              }}
              className="mt-7 w-full"
              testId="button-check-payment-again"
            >
              Check again
            </PrimaryButton>
            <PrimaryButton href="/my-history" variant="quiet" className="mt-3 w-full" testId="button-view-my-history">
              Go to My History
            </PrimaryButton>
          </div>
        ) : isCaptured ? (
          <div className="rounded-[30px] border border-primary/10 bg-card p-10 max-w-md w-full text-center shadow-lg animate-rise-in" data-testid="state-payment-captured">
            <CheckCircle2 className="mx-auto text-secondary mb-6" size={48} strokeWidth={1.5} />
            <h2 className="font-display text-4xl text-primary leading-none">Already in the archive</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              This piece has already been successfully funded.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <PrimaryButton href="/competition" className="w-full" testId="button-go-to-competition">
                View Today's Page
              </PrimaryButton>
              <PrimaryButton 
                onClick={() => {
                  setAddingAnother(true);
                  if (context?.minimumPaymentCents) {
                    form.setValue('amountDollars', (context.minimumPaymentCents / 100).toFixed(2));
                  }
                }} 
                variant="quiet" 
                className="w-full" 
                testId="button-add-another-payment"
              >
                Add Another Payment
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md animate-rise-in">
            <div className="text-center mb-8">
              <SectionKicker>The final step</SectionKicker>
              <h1 className="mt-4 font-display text-5xl leading-[.92] text-primary">Back your day.</h1>
            </div>
            
            <div className="rounded-[30px] border border-primary/10 bg-card p-8 shadow-sm">
              <div className="rounded-2xl bg-accent/10 border border-accent/20 p-5 mb-8" data-testid="payment-disclaimer">
                <div className="flex gap-3">
                  <AlertCircle className="text-accent shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-bold text-primary">Real money, non-refundable</h4>
                    <p className="mt-1 text-sm leading-6 text-primary/80">
                      Every payment is real and non-refundable, whether or not your story ends up at #1. 
                      Your ranking is determined by your own cumulative payments.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-primary/80">
                      Today&apos;s competition closes at 23:59:59 UTC.
                    </p>
                  </div>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onPay)} className="space-y-6">
                  
                  <FormField
                    control={form.control}
                    name="amountDollars"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-bold">Contribution Amount (USD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono-ui font-bold">
                              $
                            </span>
                            <Input 
                              type="number"
                              step="0.01"
                              min={(minCents / 100).toFixed(2)}
                              {...field} 
                              className="bg-muted/50 border-primary/10 h-14 rounded-xl pl-8 font-mono-ui text-lg focus-visible:ring-secondary focus-visible:border-secondary transition-all"
                              data-testid="input-payment-amount"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground mt-2">
                          Minimum amount is {formatMoney(minCents)}.
                        </p>
                      </FormItem>
                    )}
                  />

                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-primary" data-testid="payment-nonrefundable-acknowledgment">
                    <Checkbox
                      checked={paymentAcknowledged}
                      onCheckedChange={(checked) => setPaymentAcknowledged(checked === true)}
                      required
                      aria-label="I understand this payment is real and non-refundable."
                      data-testid="checkbox-payment-acknowledgment"
                      className="mt-1"
                    />
                    <span>I understand this payment is real and non-refundable.</span>
                  </label>

                  {razorpayError && (
                    <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3 font-semibold" data-testid="payment-error-message">
                      {razorpayError}
                    </div>
                  )}

                  <div className="pt-2">
                    <PrimaryButton 
                      type="submit" 
                      disabled={createOrder.isPending || !paymentAcknowledged}
                      testId="button-submit-payment"
                      className="w-full h-14 text-base"
                    >
                      {createOrder.isPending ? (
                        <>
                          <Loader2 className="animate-spin" size={18} /> Processing
                        </>
                      ) : (
                        <>
                          <Lock size={16} /> Pay {form.watch('amountDollars') ? `$${parseFloat(form.watch('amountDollars') || '0').toFixed(2)}` : ''}
                        </>
                      )}
                    </PrimaryButton>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        )}
      </main>

      <SiteFooter stats={statsQuery.data} />
    </div>
  );
}
