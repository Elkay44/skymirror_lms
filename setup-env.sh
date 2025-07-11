#!/bin/bash

# Create .env.local file with NextAuth configuration
cat > .env.local << EOL
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=g2KRcMVh71tyXFTKEwnE4/nSDCxwfpgVyxiXFx5MD2I=

# Database - Using SQLite for development
DATABASE_URL="file:./dev.db"

# Optional: OAuth Providers (uncomment and add your credentials if needed)
# GOOGLE_CLIENT_ID=your_google_client_id
# GOOGLE_CLIENT_SECRET=your_google_client_secret
# GITHUB_ID=your_github_id
# GITHUB_SECRET=your_github_secret
EOL

echo "Environment file .env.local created successfully!"
echo "Restart your dev server with 'npm run dev' to apply the changes."
