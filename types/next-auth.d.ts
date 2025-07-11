import { AdapterUser, Session, User } from 'next-auth';
import { DefaultSession } from 'next-auth';
import { Awaitable } from 'next-auth/adapters';

// Extend the default NextAuth User type
declare module 'next-auth' {
  interface User {
    role: string;
    points: number;
    level: number;
  }

  interface Session {
    user: {
      role: string;
      points: number;
      level: number;
    } & DefaultSession['user'];
  }

  interface JWT {
    role: string;
    points: number;
    level: number;
  }
}

// Extend the AdapterUser type for Prisma
declare module 'next-auth/adapters' {
  interface AdapterUser {
    role: string;
    points: number;
    level: number;
  }

  export type Awaitable<T> = T | Promise<T>;
}
