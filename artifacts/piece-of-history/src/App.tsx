import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, useAuth, Show } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  getGetCurrentUserQueryKey,
  useGetCurrentUser,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CompetitionPage, ExplorePage, HowItWorksPage, LandingPage } from '@/pages/public-pages';
import { SignInPage, SignUpPage } from '@/pages/auth-pages';
import { ParticipatePage } from '@/pages/participate-page';
import { PaymentPage } from '@/pages/payment-page';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
  Redirect,
} from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY.');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#173F51',
    colorForeground: '#173F51',
    colorMutedForeground: '#607780',
    colorBackground: '#ffffff',
    colorInput: '#F3F8F9',
    colorInputForeground: '#173F51',
    colorDanger: '#C94C5A',
    colorNeutral: '#C7D8DD',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '1rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-[24px] w-[480px] max-w-full overflow-hidden border border-[#D6E3E6] shadow-[0_20px_50px_-26px_rgba(23,63,81,.4)]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#173F51] font-[DM_Sans] text-2xl font-bold',
    headerSubtitle: 'text-[#607780]',
    socialButtonsBlockButtonText: 'text-[#173F51] font-semibold',
    formFieldLabel: 'text-[#173F51] font-semibold',
    footerActionLink: 'text-[#173F51] font-bold',
    footerActionText: 'text-[#607780]',
    dividerText: 'text-[#607780]',
    identityPreviewEditButton: 'text-[#173F51]',
    formFieldSuccessText: 'text-[#357C61]',
    alertText: 'text-[#C94C5A]',
    logoBox: 'h-12',
    logoImage: 'h-12 w-12',
    socialButtonsBlockButton: 'border-[#C7D8DD] bg-[#F3F8F9] hover:bg-[#E7F0F2]',
    formButtonPrimary: 'bg-[#173F51] hover:bg-[#245B70] text-white shadow-[3px_3px_0_#F6C95F]',
    formFieldInput: 'border-[#C7D8DD] bg-[#F3F8F9] text-[#173F51] focus:border-[#173F51] focus:ring-[#173F51]',
    footerAction: 'border-t border-[#D6E3E6]',
    dividerLine: 'bg-[#D6E3E6]',
    alert: 'bg-[#FFF0F1] border-[#E7A1AA]',
    otpCodeFieldInput: 'border-[#C7D8DD] bg-[#F3F8F9]',
    formFieldRow: 'gap-2',
    main: 'gap-5',
  },
};

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/explore" component={ExplorePage} />
        <Route path="/competition" component={CompetitionPage} />
        <Route path="/how-it-works" component={HowItWorksPage} />
        
        <Route path="/participate">
          <Show when="signed-in"><ParticipatePage /></Show>
          <Show when="signed-out"><Redirect to="/sign-in" /></Show>
        </Route>
        
        <Route path="/participate/payment/:storyId">
          <Show when="signed-in"><PaymentPage /></Show>
          <Show when="signed-out"><Redirect to="/sign-in" /></Show>
        </Route>

        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function stripBase(path: string) {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

function ProvisionLocalUser() {
  const { isLoaded, isSignedIn } = useAuth();
  useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      enabled: isLoaded && isSignedIn,
      retry: false,
    },
  });
  return null;
}

function ClerkApp() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back to the page', subtitle: 'Your next story is closer than you think.' } },
        signUp: { start: { title: 'Make a little room for today', subtitle: 'Create your place in the archive.' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ProvisionLocalUser />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkApp />
    </WouterRouter>
  );
}

export default App;
