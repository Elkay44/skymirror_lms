'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  backHref: string;
  actions?: React.ReactNode;
}

export function PageLayout({ children, title, description, backHref, actions }: PageLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && <p className="text-gray-500 mt-2">{description}</p>}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      <Card className="p-6">{children}</Card>
    </div>
  );
}
