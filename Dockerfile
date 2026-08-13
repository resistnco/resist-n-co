FROM node:20-slim

# Install OpenSSL (needed by Prisma on slim images)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install --include=dev

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Prune devDependencies
RUN npm prune --omit=dev

# Create data directory for SQLite
RUN mkdir -p /var/data

# Set environment
ENV NODE_ENV=production
ENV DATABASE_URL=file:/var/data/dev.db
ENV PORT=10000

# Expose port
EXPOSE 10000

# Start command: init DB, seed if empty, start server
CMD ["sh", "-c", "npx prisma db push --skip-generate 2>/dev/null; node -e \"const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.product.count().then(c=>{if(c===0){console.log('Seeding...');require('child_process').execSync('node render-seed.cjs');}return p.$disconnect();}).catch(()=>{console.log('DB not ready, starting anyway');});\" && node dist/index.cjs"]
