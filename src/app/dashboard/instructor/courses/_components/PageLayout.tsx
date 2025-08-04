import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type PageLayoutProps = {
  title: string;
  description?: string;
  backHref?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageLayout({
  title,
  description,
  backHref,
  actions,
  children,
}: PageLayoutProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between min-w-0">
        <div className="space-y-1">
          {backHref && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={backHref} className="flex items-center gap-2 min-w-0">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Link>
            </Button>
          )}
          <h1 className="text-2xl font-bold tracking-tight break-words">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground break-words">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 min-w-0">{actions}</div>}
      </div>
      <div className="space-y-4 lg:space-y-6">{children}</div>
    </div>
  );
}
