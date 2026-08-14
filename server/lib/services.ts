import { prisma } from './prisma';

// ============================================================
// TAX RATES — Canada
// ============================================================

interface TaxRate {
  name: string;
  rate: number; // as decimal (0.05 = 5%)
}

// TPS (GST) is 5% federally
// TVQ (QST) is 9.975% in Quebec
// TVH (HST) varies by province
const PROVINCIAL_TAX: Record<string, TaxRate> = {
  QC: { name: 'TVQ', rate: 0.09975 },
  ON: { name: 'TVH', rate: 0.08 }, // 8% provincial portion of HST 13%
  NB: { name: 'TVH', rate: 0.10 }, // 10% provincial portion of HST 15%
  NS: { name: 'TVH', rate: 0.10 },
  PE: { name: 'TVH', rate: 0.10 },
  NL: { name: 'TVH', rate: 0.10 },
  BC: { name: 'TVP', rate: 0.07 }, // 7% PST
  MB: { name: 'TVP', rate: 0.07 },
  SK: { name: 'TVP', rate: 0.06 },
  AB: { name: 'Aucune', rate: 0 },
  YT: { name: 'Aucune', rate: 0 },
  NT: { name: 'Aucune', rate: 0 },
  NU: { name: 'Aucune', rate: 0 },
};

const TPS_RATE = 0.05; // 5% federal GST

export interface TaxBreakdown {
  tps: number;
  provincial: number;
  provincialName: string;
  total: number;
}

export function calculateTaxes(subtotal: number, province: string): TaxBreakdown {
  const provincialTax = PROVINCIAL_TAX[province] || { name: 'Aucune', rate: 0 };
  const tps = Math.round(subtotal * TPS_RATE * 100) / 100;
  const provincialAmount = Math.round(subtotal * provincialTax.rate * 100) / 100;
  return {
    tps,
    provincial: provincialAmount,
    provincialName: provincialTax.name,
    total: Math.round((tps + provincialAmount) * 100) / 100,
  };
}

// ============================================================
// SHIPPING
// ============================================================

export interface ShippingResult {
  cost: number;
  isFree: boolean;
}

export async function calculateShipping(subtotal: number): Promise<ShippingResult> {
  const thresholdStr = await getSetting('shipping_free_threshold');
  const flatRateStr = await getSetting('shipping_flat_rate');
  const threshold = parseFloat(thresholdStr) || 75;
  const flatRate = parseFloat(flatRateStr) || 17.99;

  if (subtotal >= threshold) {
    return { cost: 0, isFree: true };
  }
  return { cost: flatRate, isFree: false };
}

// ============================================================
// SETTINGS
// ============================================================

export async function getSetting(key: string): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (setting?.value) return setting.value;
  // Fallback to environment variables for key settings
  const envFallbacks: Record<string, string> = {
    'interac_email': process.env.INTERAC_EMAIL || '',
    'interac_instructions': process.env.INTERAC_INSTRUCTIONS || 'Envoyez un virement Interac au montant exact avec le numéro de commande en référence.',
    'site_name': 'Resist N Co',
    'site_email': process.env.EMAIL_FROM || '',
    'currency': 'CAD',
    'shipping_flat_rate': '17.99',
    'shipping_free_threshold': '75',
  };
  return envFallbacks[key] || '';
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany();
  return Object.fromEntries(settings.map(s => [s.key, s.value]));
}

export async function updateSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

// ============================================================
// ORDER NUMBER GENERATION
// ============================================================

export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RNC-${year}-`;

  // Find the highest existing order number for this year
  const lastOrder = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
  });

  let nextNum = 1;
  if (lastOrder) {
    const numPart = lastOrder.orderNumber.replace(prefix, '');
    nextNum = parseInt(numPart, 10) + 1;
  }

  return `${prefix}${String(nextNum).padStart(6, '0')}`;
}

// ============================================================
// PRICING — Server-side validation
// ============================================================

export interface CartItemInput {
  productId: number;
  variantId?: number;
  quantity: number;
  size: string;
  color: string;
}

export interface ValidatedCartItem {
  productId: number;
  variantId: number;
  quantity: number;
  size: string;
  color: string;
  unitPrice: number;
  totalPrice: number;
  productName: string;
  productSku: string | null;
}

export async function validateCartItems(items: CartItemInput[]): Promise<{
  valid: boolean;
  items: ValidatedCartItem[];
  subtotal: number;
  error?: string;
}> {
  const validated: ValidatedCartItem[] = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { variants: true },
    });

    if (!product || !product.isActive) {
      return { valid: false, items: [], subtotal: 0, error: `Produit introuvable: ID ${item.productId}` };
    }

    // Find matching variant
    const variant = product.variants.find(
      v => v.size === item.size && v.color === item.color && v.inStock
    );

    if (!variant) {
      return {
        valid: false,
        items: [],
        subtotal: 0,
        error: `Variante introuvable: ${product.name} - ${item.size}, ${item.color}`,
      };
    }

    const unitPrice = variant.price || product.basePrice;
    const totalPrice = Math.round(unitPrice * item.quantity * 100) / 100;

    validated.push({
      productId: product.id,
      variantId: variant.id,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      unitPrice,
      totalPrice,
      productName: product.name,
      productSku: variant.sku,
    });

    subtotal += totalPrice;
  }

  subtotal = Math.round(subtotal * 100) / 100;

  return { valid: true, items: validated, subtotal };
}
