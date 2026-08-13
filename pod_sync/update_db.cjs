#!/usr/bin/env node
/**
 * Update DB with Printify product IDs and variant IDs.
 * Also update supplier to "Printify" for all products.
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  // Load Printify mappings
  const mappings = JSON.parse(fs.readFileSync('pod_sync/printify_all_mappings.json', 'utf8'));
  console.log(`Loaded ${mappings.length} product mappings`);

  let updatedProducts = 0;
  let updatedVariants = 0;

  for (const mapping of mappings) {
    const dbId = mapping.db_product_id;
    const printifyProductId = mapping.printify_product_id;

    // Update product supplier and supplierProductId
    await prisma.product.update({
      where: { id: dbId },
      data: {
        supplier: 'Printify',
        supplierProductId: printifyProductId,
      },
    });
    updatedProducts++;

    // Get DB variants for this product
    const dbVariants = await prisma.productVariant.findMany({
      where: { productId: dbId },
    });

    // Match each DB variant to a Printify variant by color and size
    for (const dbVariant of dbVariants) {
      const match = mapping.variants.find(v => {
        // Normalize color comparison
        const dbColor = (dbVariant.color || '').toLowerCase().trim();
        const printifyColor = (v.color || '').toLowerCase().trim();
        
        // Normalize size comparison
        const dbSize = (dbVariant.size || '').toLowerCase().trim();
        const printifySize = (v.size || '').toLowerCase().trim();
        
        // Handle "Unique" vs "One size"
        const sizeMatch = 
          dbSize === printifySize ||
          (dbSize === 'unique' && printifySize === 'one size') ||
          (dbSize === 'one size' && printifySize === 'unique') ||
          dbSize === '' || printifySize === '';
        
        // Handle color matching with partial matches
        const colorMatch = 
          dbColor === printifyColor ||
          dbColor === '' || printifyColor === '' ||
          dbColor.includes(printifyColor) || printifyColor.includes(dbColor);
        
        return colorMatch && sizeMatch;
      });

      if (match) {
        await prisma.productVariant.update({
          where: { id: dbVariant.id },
          data: { supplierVariantId: match.variant_id.toString() },
        });
        updatedVariants++;
      }
    }

    const matchedCount = await prisma.productVariant.count({
      where: { productId: dbId, NOT: { supplierVariantId: null } },
    });
    const totalCount = dbVariants.length;
    console.log(`  Product ${dbId}: ${matchedCount}/${totalCount} variants matched`);
  }

  console.log(`\nDone: ${updatedProducts} products updated, ${updatedVariants} variants matched`);
  
  // Summary
  const totalVariants = await prisma.productVariant.count();
  const matchedVariants = await prisma.productVariant.count({
    where: { NOT: { supplierVariantId: null } },
  });
  const unmatchedVariants = await prisma.productVariant.count({
    where: { supplierVariantId: null },
  });
  
  console.log(`\nSummary:`);
  console.log(`  Total variants: ${totalVariants}`);
  console.log(`  Matched: ${matchedVariants} (${Math.round(matchedVariants/totalVariants*100)}%)`);
  console.log(`  Unmatched: ${unmatchedVariants} (${Math.round(unmatchedVariants/totalVariants*100)}%)`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
