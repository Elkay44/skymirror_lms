#!/bin/bash

# Create .env.local file with NextAuth configuration and proper PostgreSQL database URL
cat > .env.local << EOL
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=g2KRcMVh71tyXFTKEwnE4/nSDCxwfpgVyxiXFx5MD2I=

# Simple database URL for development (uses a free PostgreSQL service)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/skymirror_lms"

# Optional: OAuth Providers (uncomment and add your credentials if needed)
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# GITHUB_ID=your_github_id
# GITHUB_SECRET=your_github_secret
EOL

# Copy to .env file for Prisma to detect it
cp .env.local .env

echo "Environment file created with simplified PostgreSQL configuration."
echo "NOTE: Make sure PostgreSQL is running on localhost:5432 with username 'postgres' and password 'postgres'."
