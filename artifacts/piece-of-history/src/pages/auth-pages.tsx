import { SignIn, SignUp } from '@clerk/react';
import { SiteFooter } from '@/components/site';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function SignInPage() {
  return (
    <div className="paper-grain flex min-h-[100dvh] flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[480px]">
          <div className="mb-6 text-center">
            <p className="font-display text-3xl text-primary">Welcome back to the page.</p>
            <p className="mt-2 text-sm text-muted-foreground">Your next story is closer than you think.</p>
          </div>
          <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function SignUpPage() {
  return (
    <div className="paper-grain flex min-h-[100dvh] flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[480px]">
          <div className="mb-6 text-center">
            <p className="font-display text-3xl text-primary">Make a little room for today.</p>
            <p className="mt-2 text-sm text-muted-foreground">Create your place in the archive.</p>
          </div>
          <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}