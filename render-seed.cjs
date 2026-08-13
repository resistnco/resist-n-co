// Seed script for Render deployment
// Reads db-seed.json and populates the database with all 24 products, 660 variants, and admin user
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const seedPath = path.resolve(__dirname, 'db-seed.json');
  if (!fs.existsSync(seedPath)) {
    console.error('db-seed.json not found — cannot seed');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  console.log(`Seeding ${data.products.length} products...`);

  // Create admin user
  if (data.adminUser) {
    const existing = await prisma.user.findFirst();
    if (!existing) {
      const adminEmail = process.env.ADMIN_EMAIL_DEFAULT || data.adminUser.email;
      const adminPassword = process.env.ADMIN_PASSWORD_DEFAULT || 'ChangeMeNow123!';
      const passwordHash = data.adminUser.passwordHash || await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: data.adminUser.role || 'admin',
        },
      });
      console.log(`Admin user created: ${adminEmail}`);
    }
  }

  // Create products with variants and images
  for (const product of data.products) {
    const existing = await prisma.product.findUnique({ where: { id: product.id } });
    if (existing) {
      console.log(`  Product ${product.id} (${product.name}) already exists — skipping`);
      continue;
    }

    await prisma.product.create({
      data: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        category: product.category,
        basePrice: product.basePrice,
        imageUrl: product.imageUrl,
        isActive: product.isActive ?? true,
        supplier: product.supplier || 'Printify',
        supplierModel: product.supplierModel,
        supplierCost: product.supplierCost,
        supplierProductId: product.supplierProductId,
        variants: {
          create: product.variants.map(v => ({
            id: v.id,
            color: v.color,
            colorHex: v.colorHex,
            size: v.size,
            price: v.price,
            sku: v.sku,
            supplierVariantId: v.supplierVariantId,
            inStock: v.inStock ?? true,
          })),
        },
        images: {
          create: (product.images || []).map(img => ({
            url: img.url,
            altText: img.altText,
            position: img.position || 0,
          })),
        },
      },
    });
    console.log(`  Created product ${product.id}: ${product.name} (${product.variants.length} variants)`);
  }

  const total = await prisma.product.count();
  const totalVariants = await prisma.productVariant.count();
  console.log(`\nSeed complete: ${total} products, ${totalVariants} variants`);
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
