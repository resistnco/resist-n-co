#!/bin/bash
set -e

echo "=== Resist N Co — Start ==="

# Ensure the data directory exists (persistent disk mount point)
mkdir -p /var/data

# Initialize the database schema (creates tables if not exist)
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || npx prisma db push --skip-generate 2>/dev/null || true

# Check if DB is empty — if so, seed it
PRODUCT_COUNT=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.product.count().then(c=>{console.log(c);return p.\$disconnect();}).catch(()=>console.log('0'));" 2>/dev/null || echo "0")

if [ "$PRODUCT_COUNT" = "0" ]; then
  echo "Database is empty — seeding from db-seed.json..."
  node render-seed.cjs
  echo "Seed complete."
else
  echo "Database has $PRODUCT_COUNT products — skipping seed."
fi

# Start the production server
# Render provides PORT automatically (usually 10000)
echo "Starting server on port ${PORT:-10000}..."
exec node dist/index.cjs
