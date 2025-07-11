#!/bin/bash

# Create .env.local file with NextAuth configuration and SQLite database URL
cat > .env.local << EOL
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=g2KRcMVh71tyXFTKEwnE4/nSDCxwfpgVyxiXFx5MD2I=

# Database - Using SQLite for easier development
DATABASE_URL="file:./dev.db"

# Optional: OAuth Providers (uncomment and add your credentials if needed)
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# GITHUB_ID=your_github_id
# GITHUB_SECRET=your_github_secret
EOL

echo "Environment file .env.local created successfully with SQLite configuration!"
echo "Running Prisma commands to initialize the database..."
