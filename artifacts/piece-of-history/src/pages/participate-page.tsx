import { useRef } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateStory, useGetSiteStats } from '@workspace/api-client-react';
import { FrostAsset, PrimaryButton, SectionKicker, SiteNav, SiteFooter } from '@/components/site';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Loader2 } from 'lucide-react';

const participateSchema = z.object({
  displayName: z.string().min(1, 'Please enter a display name').max(50, 'Display name is too long'),
  storyText: z.string().min(1, 'Please write your piece').max(500, 'Your piece must be 500 characters or less'),
  websiteUrl: z.string().refine(val => {
    if (!val) return true;
    try {
      const url = new URL(val);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Please enter a valid HTTP or HTTPS URL').nullable().transform(v => v === '' ? null : v),
});

type ParticipateFormValues = z.infer<typeof participateSchema>;

export function ParticipatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const statsQuery = useGetSiteStats();
  
  const form = useForm<ParticipateFormValues>({
    resolver: zodResolver(participateSchema),
    defaultValues: {
      displayName: '',
      storyText: '',
      websiteUrl: '',
    },
  });

  const createStory = useCreateStory();
  const mutateFnRef = useRef(createStory.mutate);
  mutateFnRef.current = createStory.mutate;

  function onSubmit(values: ParticipateFormValues) {
    mutateFnRef.current({
      data: {
        displayName: values.displayName,
        storyText: values.storyText,
        websiteUrl: values.websiteUrl,
      }
    }, {
      onSuccess: (context) => {
        setLocation(`/participate/payment/${context.storyId}`);
      },
      onError: (err) => {
        toast({
          title: 'Something went wrong',
          description: 'We could not save your piece. Please try again.',
          variant: 'destructive',
        });
      }
    });
  }

  const textValue = form.watch('storyText') || '';
  const remainingChars = 500 - textValue.length;

  return (
    <div className="paper-grain min-h-[100dvh] flex flex-col">
      <SiteNav />
      
      <main className="flex-1 mx-auto w-full max-w-2xl px-5 py-16 sm:px-8 md:py-24 lg:px-12">
        <div className="mb-10 text-center animate-rise-in">
          <SectionKicker>The empty page</SectionKicker>
          <h1 className="mt-5 font-display text-5xl leading-[.92] text-primary md:text-6xl">Leave your mark on today.</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground max-w-md mx-auto">
            Write a short piece. 500 characters maximum. No drafts, just memory.
          </p>
        </div>
        
         <div className="ice-shell rounded-[26px] p-6 sm:p-10 animate-rise-in" style={{ animationDelay: '100ms' }}>
           <div className="relative z-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-primary font-bold">
                      <FrostAsset name="profile" size={19} className="frost-asset-quiet" />
                      How should we call you?
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Your name or pen name" 
                        {...field} 
                        value={field.value || ''}
                        className="bg-muted/50 border-primary/10 h-12 rounded-xl focus-visible:ring-secondary focus-visible:border-secondary transition-all"
                        data-testid="input-display-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storyText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between text-primary font-bold">
                      <div className="flex items-center gap-2">
                        <FrostAsset name="yourPieceBadge" size={18} className="frost-asset-quiet" />
                        Today's Piece
                      </div>
                      <span className={`font-mono-ui text-[10px] uppercase tracking-wider ${remainingChars < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {remainingChars} left
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="It started when..." 
                        {...field} 
                        className="bg-muted/50 border-primary/10 min-h-[200px] resize-none rounded-2xl p-4 text-base leading-relaxed focus-visible:ring-secondary focus-visible:border-secondary transition-all"
                        data-testid="input-story-text"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-primary font-bold">
                      <FrostAsset name="globe" size={19} className="frost-asset-quiet" />
                      Website <span className="font-normal text-muted-foreground ml-1">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://your-site.com" 
                        {...field} 
                        value={field.value || ''}
                        className="bg-muted/50 border-primary/10 h-12 rounded-xl focus-visible:ring-secondary focus-visible:border-secondary transition-all"
                        data-testid="input-website-url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t border-primary/10 flex justify-end">
                <PrimaryButton 
                  type="submit" 
                  disabled={createStory.isPending} 
                  testId="button-submit-story"
                >
                  {createStory.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Saving piece
                    </>
                  ) : (
                    <>
                      Continue to payment <ArrowRight size={16} />
                    </>
                  )}
                </PrimaryButton>
              </div>
            </form>
           </Form>
           </div>
        </div>
      </main>

      <SiteFooter stats={statsQuery.data} />
    </div>
  );
}
