// Enhanced authentication system with security best practices
/* eslint-disable */
import { AuthOptions, User, Session, DefaultSession } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from './prisma-extensions';
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
    email: string;
    name: string | null;
    role: string;
    points: number;
    level: number;
    needsOnboarding: boolean;
    iat: number;
    exp: number;
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
          if (user.role === 'STUDENT' && !user.studentProfile) {
            console.log('Student is missing a student profile - creating default');
            try {
              const profile = await prisma.studentProfile.create({
                data: {
                  userId: user.id,
                  bio: 'New student',
                },
              });
              console.log('Created default student profile:', profile.id);
              const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                points: user.points,
                level: user.level,
                needsOnboarding: user.needsOnboarding,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                studentProfile: profile,
                mentorProfile: user.mentorProfile,
                password: user.password // Include password since it's required by User type
              };

              return userData as User;
            } catch (error) {
              console.error('Failed to create student profile:', error);
              return null;
            }
          }

          const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            points: user.points,
            level: user.level,
            needsOnboarding: user.needsOnboarding,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            studentProfile: user.studentProfile,
            mentorProfile: user.mentorProfile,
            password: user.password // Include password since it's required by User type
          };

          return userData as User;
        } catch (error) {
          console.error('Authentication error:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'UnknownError',
            stack: error instanceof Error ? error.stack : undefined
          });
          
          // Provide more specific error messages for database errors
          if (error instanceof Error && error.message.includes('permission denied')) {
            console.error('Database permission error - check database user permissions');
            return null;
          }
          
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
        
        logger.info('Sign in attempt:', {
          userId: user.id,
          email: user.email,
          role: user.role,
          needsOnboarding: user.needsOnboarding
        });
        
        return true;
        
      } catch (error) {
        logger.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      try {
        // Initial sign in
        if (user) {
          logger.debug('Creating new JWT token:', {
            userId: user.id,
            role: user.role
          });
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            points: user.points || 0,
            level: user.level || 1,
            needsOnboarding: user.needsOnboarding !== false,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
          };
        }
        
        // Token refresh
        if (token?.id && token?.role) {
          logger.debug('Refreshing JWT token:', {
            userId: token.id,
            role: token.role
          });
          return token;
        }
        
        logger.debug('Creating empty JWT token');
        return {
          id: '',
          email: '',
          name: null,
          role: '',
          points: 0,
          level: 1,
          needsOnboarding: true,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
        } as JWT;
      } catch (error) {
        logger.error('Error in JWT callback:', error);
        return {
          id: '',
          email: '',
          name: null,
          role: '',
          points: 0,
          level: 1,
          needsOnboarding: true,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)
        } as JWT;
      }
    },
    async session({ session, token }) {
      try {
        if (token?.id && token?.role) {
          logger.debug('Updating session with token data:', {
            userId: token.id,
            role: token.role
          });
          
          session.user = {
            id: token.id,
            email: token.email,
            name: token.name,
            role: token.role,
            points: token.points,
            level: token.level,
            needsOnboarding: token.needsOnboarding,
            image: session.user?.image
          } as Session['user'];
        }
        
        logger.debug('Returning session:', {
          userId: session.user?.id,
          hasRole: !!session.user?.role
        });
        
        return session;
      } catch (error) {
        logger.error('Error in session callback:', error);
        return session;
      }
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
