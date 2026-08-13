import { prisma } from '../prisma';
import { getPODProvider, PODOrderItem, PODShippingAddress } from './provider';
import { sendPaymentConfirmedEmail } from '../email';

export async function sendOrderToPOD(orderId: number): Promise<{ success: boolean; error?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.paymentStatus !== 'paid') {
    return { success: false, error: 'Order is not paid — cannot send to POD' };
  }

  // Get products with supplier info and their variants
  const products = await prisma.product.findMany({
    where: { id: { in: order.items.map(i => i.productId) } },
  });

  // Get product variants for matching supplier variant IDs
  const productVariants = await prisma.productVariant.findMany({
    where: { 
      productId: { in: order.items.map(i => i.productId) },
      id: { in: order.items.map(i => i.variantId).filter(Boolean) as number[] },
    },
  });

  // Since all products are now on Printify, use Printify as the single supplier
  const supplierName = 'Printify';
  const provider = getPODProvider(supplierName);
  if (!provider) {
    return { success: false, error: `Unknown POD provider: ${supplierName}` };
  }

  if (!provider.isConfigured) {
    return { success: false, error: `${supplierName} API key not configured` };
  }

  // Create POD order record
  const podOrder = await prisma.pODOrder.create({
    data: {
      orderId: order.id,
      supplier: supplierName,
      status: 'pending',
      items: JSON.stringify(order.items),
    },
  });

  try {
    const podItems: PODOrderItem[] = order.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      // Find the ProductVariant to get the supplierVariantId
      const variant = productVariants.find(v => v.id === item.variantId);
      
      // Use the supplier variant ID from the variant, fall back to the item's variantId
      const supplierVariantId = variant?.supplierVariantId || String(item.variantId || '');
      
      if (!supplierVariantId) {
        console.warn(`[POD] No supplierVariantId for order item (product: ${item.productId}, variant: ${item.variantId})`);
      }
      
      return {
        productId: product?.supplierProductId || String(item.productId),
        variantId: supplierVariantId,
        quantity: item.quantity,
      };
    });

    const shippingAddress: PODShippingAddress = {
      name: order.customerName,
      address1: order.shippingAddress,
      city: order.city,
      state: order.province,
      zip: order.postalCode,
      country: order.country,
      email: order.customerEmail,
      phone: order.customerPhone || undefined,
    };

    const result = await provider.createOrder(order.orderNumber, podItems, shippingAddress);

    await prisma.pODOrder.update({
      where: { id: podOrder.id },
      data: {
        supplierOrderId: result.supplierOrderId,
        status: 'sent',
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        podOrderId: result.supplierOrderId,
        podStatus: result.status,
        orderStatus: 'processing',
      },
    });

    await sendPaymentConfirmedEmail(order);

    console.log(`[POD] Order ${order.orderNumber} sent to ${supplierName} (ID: ${result.supplierOrderId})`);
    return { success: true };
  } catch (err: any) {
    await prisma.pODOrder.update({
      where: { id: podOrder.id },
      data: { status: 'failed', error: err.message },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { fulfillmentNote: `POD error: ${err.message}` },
    });

    console.error(`[POD] Failed to send order ${order.orderNumber}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

export async function retryPODOrder(orderId: number): Promise<{ success: boolean; error?: string }> {
  // Cancel existing POD order if any
  const existing = await prisma.pODOrder.findFirst({
    where: { orderId, status: { in: ['failed', 'pending'] } },
  });
  if (existing) {
    await prisma.pODOrder.delete({ where: { id: existing.id } });
  }
  return sendOrderToPOD(orderId);
}

export async function updatePODTracking(orderId: number): Promise<{ success: boolean; tracking?: any }> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.podOrderId) {
    return { success: false };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: (await prisma.orderItem.findMany({ where: { orderId } })).map(i => i.productId) } },
  });
  const supplierName = 'Printify';
  const provider = getPODProvider(supplierName);
  if (!provider || !provider.isConfigured) return { success: false };

  try {
    const result = await provider.getTracking(order.podOrderId);
    await prisma.order.update({
      where: { id: orderId },
      data: {
        podStatus: result.status,
        trackingNumber: result.trackingNumber || undefined,
        trackingUrl: result.trackingUrl || undefined,
        carrier: result.carrier || undefined,
        ...(result.trackingNumber ? { orderStatus: 'shipped', shippedAt: new Date() } : {}),
      },
    });
    return { success: true, tracking: result };
  } catch (err: any) {
    console.error(`[POD] Tracking update failed: ${err.message}`);
    return { success: false };
  }
}
