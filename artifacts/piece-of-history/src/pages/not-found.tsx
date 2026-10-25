import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { SiteFooter } from '@/components/site';

export default function NotFound() {
  return (
    <div className="paper-grain flex min-h-screen w-full flex-col">
      <main className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h1 className="text-2xl font-bold text-foreground">
                404 Page Not Found
              </h1>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Did you forget to add the page to the router?
            </p>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
