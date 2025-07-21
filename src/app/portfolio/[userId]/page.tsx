/* eslint-disable */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import PortfolioContent from './PortfolioContent';

export const metadata: Metadata = {
  title: 'Portfolio | SkyMirror Academy',
  description: 'View portfolio',
};

interface PublicPortfolioProps {
  params: Promise<{ userId: string }>;
}

export default async function PublicPortfolio({ params }: PublicPortfolioProps) {
  const { userId } = await params;
  
  if (!userId) redirect('/');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      enrollments: {
        include: {
          course: true,
          submissions: {
            where: { status: 'SUBMITTED' },
            include: { project: true },
          },
        },
      },
    },
  });

  if (!user) redirect('/');

  return <PortfolioContent user={user} />;
}
