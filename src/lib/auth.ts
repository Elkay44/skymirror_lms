// Enhanced authentication system with security best practices
/* eslint-disable */
import { AuthOptions, User, Session, DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { JWT } from 'next-auth/jwt';
import { logger } from './logger';

// Simple base URL configuration
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
console.log('Auth base URL:', baseUrl);

// Simple URL validation function
const isValidUrl = (url: string): boolean => {
  try {
    // Just check if it's a relative path or a valid URL
    return url.startsWith('/') || Boolean(new URL(url));
  } catch {
    return false;
  }
};

// Extend NextAuth types with our custom fields
declare module 'next-auth' {
  // Custom User interface with gameification fields
  interface User {
    id: string;
    name: string | null;
    email: string;
    password: string;
    role: string;
    points: number;
    level: number;
    needsOnboarding: boolean;
    createdAt: Date;
    updatedAt: Date;
    studentProfile?: {
      id: string;
      bio: string | null;
      learningGoals: string;
    };
    mentorProfile?: {
      id: string;
      bio: string | null;
    };
  }

  // Custom Session interface
  interface Session {
    user: User & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }

  // JWT token type with gameification fields
  interface JWT {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    points: number;
    level: number;
    needsOnboarding: boolean;
    invalidRole: boolean;
  }
}

// Enhanced authentication configuration with multiple providers and security features
const authOptions: AuthOptions = {
  // Use the validated URL
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  debug: process.env.NODE_ENV === 'development',
  adapter: PrismaAdapter(prisma),
  
  events: {
    async linkAccount(message: any) {
      logger.info('Account linked:', message);
    },
  },
  
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials: Record<"email" | "password" | "role", string> | undefined) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials');
            return null;
          }

          console.log('Attempting login for:', {
            email: credentials.email,
            role: credentials.role
          });

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              studentProfile: true,
              mentorProfile: true
            } as const
          });

          console.log('User found:', {
            id: user?.id,
            role: user?.role,
            hasStudentProfile: !!user?.studentProfile,
            hasMentorProfile: !!user?.mentorProfile
          });

          if (!user) {
            console.log('No user found with email:', credentials.email);
            return null;
          }

          if (!user?.password) {
            console.log('User has no password set');
            return null;
          }
          
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            console.log('Invalid password for user:', user.email);
            return null;
          }

          // Check if the user's role matches the requested role
          if (user.role !== credentials.role) {
            console.log(`User role (${user.role}) does not match requested role (${credentials.role})`);
            return null;
          }

          // For students, ensure they have a student profile
          let updatedUser = user;
          if (user.role === 'STUDENT' && !user.studentProfile) {
            console.log('Student is missing a student profile - creating default');
            try {
              const profile = await prisma.studentProfile.create({
                data: {
                  userId: user.id,
                  learningGoals: 'Add your learning goals here',
                  bio: 'New student',
                },
              });
              console.log('Created default student profile:', profile.id);
              updatedUser = {
                ...user,
                studentProfile: profile
              };
            } catch (error) {
              console.error('Failed to create student profile:', error);
              // Continue with the original user object
            }
          }

          return {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            points: updatedUser.points,
            level: updatedUser.level,
            needsOnboarding: updatedUser.needsOnboarding,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
            studentProfile: updatedUser.studentProfile,
            mentorProfile: updatedUser.mentorProfile
          } as unknown as User;
        } catch (error) {
          logger.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  } as const,
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        if (!user) {
          logger.error('No user in signIn callback');
          return false;
        }
        
        // Log sign-in attempt for debugging
        logger.info('Sign in attempt:', {
          userId: user.id,
          email: user.email,
          role: user.role,
          needsOnboarding: user.needsOnboarding
        });
        
        // Don't return any URL, let the client handle the redirection
        // This prevents any URL construction issues in NextAuth
        return true;
        
      } catch (error) {
        logger.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          points: user.points || 0,
          level: user.level || 1,
          needsOnboarding: user.needsOnboarding !== false, // Default to true if not set
          email: user.email,
          name: user.name
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          points: token.points as number,
          level: token.level as number,
          needsOnboarding: token.needsOnboarding as boolean,
          email: token.email as string,
          name: token.name as string | null
        };
      }
      return session;
    }
  },
  // Pages configuration - use relative paths only
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
    verifyRequest: '/auth/verify-request',
    newUser: '/onboarding'
  },
  
  // Cookie settings with enhanced security
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      }
    }
  },
  
  // Debug configuration
  logger: {
    error(code: string, metadata: any) {
      logger.error(`Auth error (${code}):`, metadata);
    },
    warn(code: string) {
      logger.warn(`Auth warning (${code})`);
    },
    debug(code: string, metadata: any) {
      logger.debug(`Auth debug (${code}):`, metadata);
    },
  }
};

export default authOptions;
export { authOptions };
