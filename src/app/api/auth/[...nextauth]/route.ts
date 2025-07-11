// Core authentication imports
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Main authentication handler
// Handles both GET and POST requests for authentication
const handler = NextAuth(authOptions);

// Export both GET and POST methods
// GET: Used for session checks
// POST: Used for authentication actions
export { handler as GET, handler as POST };
