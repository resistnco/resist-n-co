#!/bin/bash
set -e

echo "=== Resist N Co — Build ==="

# Install ALL dependencies (including devDependencies needed for build)
# NODE_ENV=production would skip devDeps, so we override
npm install --include=dev

# Generate Prisma client
npx prisma generate

# Build the app (client + server bundle)
npm run build

# Prune devDependencies to reduce image size
npm prune --omit=dev

echo "=== Build complete ==="
