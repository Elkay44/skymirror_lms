#!/bin/bash

# Create .env.local file with NextAuth configuration and proper PostgreSQL database URL
cat > .env.local << EOL
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=g2KRcMVh71tyXFTKEwnE4/nSDCxwfpgVyxiXFx5MD2I=

# Database - Using PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/skymirror_lms?schema=public"

# Optional: OAuth Providers (uncomment and add your credentials if needed)
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# GITHUB_ID=your_github_id
# GITHUB_SECRET=your_github_secret
EOL

echo "Environment file .env.local created successfully with PostgreSQL configuration!"
echo "Note: Make sure PostgreSQL is running on localhost:5432 with the credentials specified."
echo "Restart your dev server with 'npm run dev' to apply the changes."
