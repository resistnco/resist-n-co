import Stripe from 'stripe';
import { prisma } from './prisma';
import { generateOrderNumber, calculateTaxes, calculateShipping, validateCartItems, getSetting, CartItemInput } from './services';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY not configured. Set it in .env');
  }
  if (!stripe) {
    stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' as any });
  }
  return stripe;
}

export function isStripeConfigured(): boolean {
  return !!stripeSecretKey;
}

export interface CreateCheckoutParams {
  items: CartItemInput[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
}

export async function createStripeCheckoutSession(params: CreateCheckoutParams) {
  // 1. Validate cart items server-side
  const { valid, items, subtotal, error } = await validateCartItems(params.items);
  if (!valid || items.length === 0) {
    return { error: error || 'Panier invalide', sessionId: null };
  }

  // 2. Calculate shipping and taxes
  const shipping = await calculateShipping(subtotal);
  const taxes = calculateTaxes(subtotal, params.province);
  const total = Math.round((subtotal + shipping.cost + taxes.total) * 100) / 100;

  // 3. Generate order number
  const orderNumber = await generateOrderNumber();

  // 4. Create order in database (status: pending)
  const order = await prisma.order.create({
    data: {
      orderNumber,
      visitorId: params.customerEmail,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone || null,
      shippingAddress: params.shippingAddress,
      city: params.city,
      province: params.province,
      postalCode: params.postalCode,
      country: params.country || 'Canada',
      subtotal,
      shipping: shipping.cost,
      taxes: taxes.total,
      total,
      paymentMethod: 'stripe',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      items: {
        create: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          productSku: item.productSku,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      },
      address: {
        create: {
          address: params.shippingAddress,
          city: params.city,
          province: params.province,
          postalCode: params.postalCode,
          country: params.country || 'Canada',
        },
      },
    },
  });

  // 5. Create payment record
  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: 'stripe',
      amount: total,
      status: 'pending',
    },
  });

  // 6. Create Stripe Checkout Session
  const siteUrl = process.env.SITE_URL || 'http://localhost:5000';
  const stripeClient = getStripe();

  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      ...items.map(item => ({
        price_data: {
          currency: 'cad',
          product_data: {
            name: `${item.productName} (${item.size}, ${item.color})`,
          },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      })),
      ...(shipping.cost > 0 ? [{
        price_data: {
          currency: 'cad',
          product_data: { name: 'Livraison' },
          unit_amount: Math.round(shipping.cost * 100),
        },
        quantity: 1,
      }] : []),
      {
        price_data: {
          currency: 'cad',
          product_data: { name: `Taxes (${taxes.provincialName} + TPS)` },
          unit_amount: Math.round(taxes.total * 100),
        },
        quantity: 1,
      },
    ],
    customer_email: params.customerEmail,
    success_url: `${siteUrl}/#/paiement/succes?order=${orderNumber}`,
    cancel_url: `${siteUrl}/#/paiement/echec?order=${orderNumber}`,
    metadata: {
      orderNumber,
      orderId: String(order.id),
    },
  });

  // 7. Update order with Stripe session ID
  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id },
  });

  return { sessionId: session.id, sessionUrl: session.url, orderNumber, orderId: order.id };
}

// ============================================================
// WEBHOOK HANDLER
// ============================================================

export async function handleStripeWebhook(payload: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!webhookSecret) {
    return { received: false, error: 'STRIPE_WEBHOOK_SECRET not configured' };
  }

  const stripeClient = getStripe();
  let event: Stripe.Event;

  try {
    event = stripeClient.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    return { received: false, error: `Webhook signature verification failed: ${err.message}` };
  }

  // Idempotency: check if event already processed
  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId: event.id },
  });
  if (existing?.processed) {
    return { received: true, duplicate: true };
  }

  // Store event
  const webhookEvent = await prisma.webhookEvent.upsert({
    where: { eventId: event.id },
    update: {},
    create: {
      provider: 'stripe',
      eventId: event.id,
      eventType: event.type,
      payload: JSON.stringify(event),
    },
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderNumber = session.metadata?.orderNumber;
        if (!orderNumber) break;

        const order = await prisma.order.findUnique({
          where: { orderNumber },
        });
        if (!order) break;

        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid',
            orderStatus: 'paid',
            stripePaymentIntentId: paymentIntentId || null,
            paidAt: new Date(),
          },
        });

        await prisma.payment.updateMany({
          where: { orderId: order.id, provider: 'stripe' },
          data: { status: 'succeeded', transactionId: paymentIntentId || session.id },
        });

        console.log(`[Stripe] Order ${orderNumber} marked as paid`);
        break;
      }

      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        // Already handled in checkout.session.completed, but ensure idempotency
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const order = await prisma.order.findFirst({
          where: { stripePaymentIntentId: intent.id },
        });
        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'failed', orderStatus: 'cancelled' },
          });
          await prisma.payment.updateMany({
            where: { orderId: order.id, provider: 'stripe' },
            data: { status: 'failed', failureReason: intent.last_payment_error?.message || 'Payment failed' },
          });
          console.log(`[Stripe] Order ${order.orderNumber} payment failed`);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderNumber = session.metadata?.orderNumber;
        if (orderNumber) {
          const order = await prisma.order.findUnique({ where: { orderNumber } });
          if (order && order.paymentStatus === 'pending') {
            await prisma.order.update({
              where: { id: order.id },
              data: { orderStatus: 'cancelled', paymentStatus: 'failed' },
            });
            console.log(`[Stripe] Order ${orderNumber} session expired`);
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const order = await prisma.order.findFirst({
          where: { stripePaymentIntentId: charge.payment_intent as string },
        });
        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'refunded', orderStatus: 'refunded' },
          });
          await prisma.payment.create({
            data: {
              orderId: order.id,
              provider: 'stripe',
              amount: charge.amount_refunded / 100,
              status: 'refunded',
              transactionId: charge.id,
            },
          });
          console.log(`[Stripe] Order ${order.orderNumber} refunded`);
        }
        break;
      }
    }

    // Mark as processed
    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { processed: true, processedAt: new Date() },
    });

    return { received: true };
  } catch (err: any) {
    console.error(`[Stripe] Webhook processing error: ${err.message}`);
    return { received: true, error: err.message };
  }
}
