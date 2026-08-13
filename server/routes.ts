import type { Express } from 'express';
import { prisma } from './lib/prisma';
import { validateCartItems, calculateTaxes, calculateShipping, generateOrderNumber, getSetting, getAllSettings, updateSetting } from './lib/services';
import { createStripeCheckoutSession, handleStripeWebhook, isStripeConfigured } from './lib/stripe';
import { adminLogin, requireAdmin } from './lib/auth';
import { sendOrderCreatedEmail, sendInteracInstructionsEmail, sendPaymentConfirmedEmail, sendPaymentFailedEmail, sendRefundEmail, sendOrderShippedEmail, sendOrderDeliveredEmail, isEmailConfigured } from './lib/email';
import { sendOrderToPOD, retryPODOrder, updatePODTracking } from './lib/pod/fulfillment';
import { getPODProvider } from './lib/pod/provider';
import Stripe from 'stripe';

export function registerRoutes(app: Express) {

  // ============================================================
  // HEALTH CHECK — for Render deployment
  // ============================================================

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ============================================================
  // PRODUCTS — Public
  // ============================================================

  app.get('/api/products', async (req, res) => {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        include: {
          variants: { where: { inStock: true } },
          images: { orderBy: { position: 'asc' } },
        },
        orderBy: { id: 'asc' },
      });

      // Group variants by color/size for frontend
      const formatted = products.map(p => ({
        ...p,
        colors: Array.from(new Map(p.variants.map(v => [v.color, { name: v.color, hex: v.colorHex }])).values()),
        sizes: Array.from(new Set(p.variants.map(v => v.size))),
      }));

      res.json(formatted);
    } catch (err: any) {
      console.error('[API] Products error:', err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.get('/api/products/:slug', async (req, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { slug: req.params.slug },
        include: {
          variants: true,
          images: { orderBy: { position: 'asc' } },
        },
      });
      if (!product || !product.isActive) {
        return res.status(404).json({ error: 'Produit introuvable' });
      }
      const colors = Array.from(new Map(product.variants.map(v => [v.color, { name: v.color, hex: v.colorHex }])).values());
      const sizes = Array.from(new Set(product.variants.map(v => v.size)));
      res.json({ ...product, colors, sizes });
    } catch (err: any) {
      console.error('[API] Product error:', err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // ============================================================
  // CART — Public (visitor-based)
  // ============================================================

  app.get('/api/cart/:visitorId', async (req, res) => {
    try {
      const cart = await prisma.cart.findUnique({
        where: { visitorId: req.params.visitorId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
      if (!cart) {
        return res.json({ items: [] });
      }
      res.json({ items: cart.items });
    } catch (err: any) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.post('/api/cart/:visitorId', async (req, res) => {
    try {
      const { productId, variantId, quantity, size, color, designData, designPreview } = req.body;

      // Server-side price validation
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product || !product.isActive) {
        return res.status(400).json({ error: 'Produit invalide' });
      }

      const variant = await prisma.productVariant.findFirst({
        where: { productId, size, color, inStock: true },
      });
      if (!variant) {
        return res.status(400).json({ error: 'Variante non disponible' });
      }

      const unitPrice = variant.price || product.basePrice;

      // Get or create cart
      let cart = await prisma.cart.findUnique({ where: { visitorId: req.params.visitorId } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { visitorId: req.params.visitorId } });
      }

      // Check if item already exists
      const existing = await prisma.cartItem.findFirst({
        where: { cartId: cart.id, productId, variantId: variant.id },
      });

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            variantId: variant.id,
            quantity,
            designData: designData || null,
            designPreview: designPreview || null,
            unitPrice,
          },
        });
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error('[API] Cart add error:', err.message);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.patch('/api/cart/:visitorId/:itemId', async (req, res) => {
    try {
      const { quantity } = req.body;
      if (quantity < 1) {
        return res.status(400).json({ error: 'Quantité invalide' });
      }
      await prisma.cartItem.update({
        where: { id: parseInt(req.params.itemId) },
        data: { quantity },
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.delete('/api/cart/:visitorId/:itemId', async (req, res) => {
    try {
      await prisma.cartItem.delete({
        where: { id: parseInt(req.params.itemId) },
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.delete('/api/cart/:visitorId', async (req, res) => {
    try {
      const cart = await prisma.cart.findUnique({ where: { visitorId: req.params.visitorId } });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // ============================================================
  // CHECKOUT — Stripe
  // ============================================================

  app.post('/api/checkout/stripe', async (req, res) => {
    try {
      const { items, customerName, customerEmail, customerPhone, shippingAddress, city, province, postalCode } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Panier vide' });
      }

      if (!isStripeConfigured()) {
        return res.status(503).json({ error: 'Stripe n\'est pas configuré. Ajoutez STRIPE_SECRET_KEY au fichier .env' });
      }

      const result = await createStripeCheckoutSession({
        items,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        city,
        province,
        postalCode,
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      // Send order created email
      const order = await prisma.order.findUnique({
        where: { id: result.orderId! },
      });
      if (order) {
        sendOrderCreatedEmail(order).catch(e => console.error('[Email] Order created email failed:', e.message));
      }

      res.json({ url: result.sessionUrl, orderNumber: result.orderNumber });
    } catch (err: any) {
      console.error('[API] Stripe checkout error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // CHECKOUT — Interac
  // ============================================================

  app.post('/api/checkout/interac', async (req, res) => {
    try {
      const { items, customerName, customerEmail, customerPhone, shippingAddress, city, province, postalCode } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Panier vide' });
      }

      // Validate cart server-side
      const { valid, items: validatedItems, subtotal, error } = await validateCartItems(items);
      if (!valid) {
        return res.status(400).json({ error });
      }

      const shipping = await calculateShipping(subtotal);
      const taxes = calculateTaxes(subtotal, province);
      const total = Math.round((subtotal + shipping.cost + taxes.total) * 100) / 100;
      const orderNumber = await generateOrderNumber();

      const order = await prisma.order.create({
        data: {
          orderNumber,
          visitorId: customerEmail,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          shippingAddress,
          city,
          province,
          postalCode,
          country: 'Canada',
          subtotal,
          shipping: shipping.cost,
          taxes: taxes.total,
          total,
          paymentMethod: 'interac',
          paymentStatus: 'pending',
          orderStatus: 'awaiting_payment',
          items: {
            create: validatedItems.map(item => ({
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
            create: { address: shippingAddress, city, province, postalCode, country: 'Canada' },
          },
        },
      });

      await prisma.payment.create({
        data: { orderId: order.id, provider: 'interac', amount: total, status: 'pending' },
      });

      // Send emails asynchronously (non-blocking) so checkout responds immediately
      sendOrderCreatedEmail(order).catch(e => console.error('[Email] Order created email failed:', e.message));
      sendInteracInstructionsEmail(order).catch(e => console.error('[Email] Interac instructions email failed:', e.message));

      res.json({ orderNumber, total, interacEmail: await getSetting('interac_email') });
    } catch (err: any) {
      console.error('[API] Interac checkout error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // ORDER — Public lookup by order number
  // ============================================================

  app.get('/api/orders/:orderNumber', async (req, res) => {
    try {
      const order = await prisma.order.findUnique({
        where: { orderNumber: req.params.orderNumber },
        include: { items: true, payments: true },
      });
      if (!order) {
        return res.status(404).json({ error: 'Commande introuvable' });
      }
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // ============================================================
  // STRIPE WEBHOOK
  // ============================================================

  app.post('/api/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    // raw body from express.raw middleware (Buffer)
    const payload = Buffer.isBuffer(req.body) ? req.body.toString() : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    const result = await handleStripeWebhook(payload, sig || '');

    if (result.received) {
      res.json({ received: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  });

  // ============================================================
  // ADMIN — Auth
  // ============================================================

  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await adminLogin(email, password);
      if (!result.success || !result.user) {
        return res.status(401).json({ error: result.error });
      }
      req.session.adminId = result.user.id;
      req.session.adminEmail = result.user.email;
      req.session.adminRole = result.user.role;
      req.session.save((err: any) => {
        if (err) {
          console.error('[Admin] Session save error:', err);
          return res.status(500).json({ error: 'Erreur de session' });
        }
        res.json({ user: result.user });
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  app.post('/api/admin/logout', (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  app.get('/api/admin/me', requireAdmin, (req, res) => {
    res.json({ user: req.adminUser });
  });

  // ============================================================
  // ADMIN — Dashboard
  // ============================================================

  app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [todayOrders, weekOrders, monthOrders, pendingOrders, interacPending, paidOrders, podOrders, shippedOrders, problemOrders] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.order.count({ where: { createdAt: { gte: startOfWeek } } }),
        prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.order.count({ where: { orderStatus: 'pending' } }),
        prisma.order.count({ where: { paymentMethod: 'interac', paymentStatus: 'pending' } }),
        prisma.order.count({ where: { paymentStatus: 'paid' } }),
        prisma.order.count({ where: { podOrderId: { not: null } } }),
        prisma.order.count({ where: { orderStatus: 'shipped' } }),
        prisma.order.count({ where: { orderStatus: { in: ['cancelled', 'refunded'] } } }),
      ]);

      const [todayRevenue, monthRevenue] = await Promise.all([
        prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: startOfDay }, paymentStatus: 'paid' } }),
        prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: startOfMonth }, paymentStatus: 'paid' } }),
      ]);

      res.json({
        sales: {
          today: todayRevenue._sum.total || 0,
          week: 0,
          month: monthRevenue._sum.total || 0,
        },
        orders: {
          today: todayOrders,
          week: weekOrders,
          month: monthOrders,
          pending: pendingOrders,
          interacPending,
          paid: paidOrders,
          pod: podOrders,
          shipped: shippedOrders,
          problems: problemOrders,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // ADMIN — Orders
  // ============================================================

  app.get('/api/admin/orders', requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const paymentMethod = req.query.paymentMethod as string | undefined;
      const search = req.query.search as string | undefined;
      const where: any = {};
      if (status) where.orderStatus = status;
      if (paymentMethod) where.paymentMethod = paymentMethod;
      if (search) where.orderNumber = { contains: String(search) };

      const orders = await prisma.order.findMany({
        where,
        include: { items: true, payments: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/orders/:id', requireAdmin, async (req, res) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: parseInt(req.params.id as string) },
        include: { items: { include: { product: true } }, payments: true, address: true, podOrders: true },
      });
      if (!order) return res.status(404).json({ error: 'Commande introuvable' });
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Confirm Interac payment
  app.post('/api/admin/orders/:id/confirm-interac', requireAdmin, async (req, res) => {
    try {
      const order = await prisma.order.findUnique({ where: { id: parseInt(req.params.id as string) } });
      if (!order) return res.status(404).json({ error: 'Commande introuvable' });
      if (order.paymentMethod !== 'interac') return res.status(400).json({ error: 'Cette commande n\'est pas un paiement Interac' });

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'paid', orderStatus: 'paid', paidAt: new Date() },
      });

      await prisma.payment.updateMany({
        where: { orderId: order.id, provider: 'interac' },
        data: { status: 'succeeded' },
      });

      await sendPaymentConfirmedEmail(order);

      // Auto-send to POD
      const podResult = await sendOrderToPOD(order.id);
      if (!podResult.success) {
        console.log(`[Admin] POD send failed for ${order.orderNumber}: ${podResult.error}`);
      }

      res.json({ success: true, message: 'Paiement confirmé et commande envoyée au POD' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Retry POD
  app.post('/api/admin/orders/:id/retry-pod', requireAdmin, async (req, res) => {
    try {
      const result = await retryPODOrder(parseInt(req.params.id as string));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update tracking
  app.post('/api/admin/orders/:id/update-tracking', requireAdmin, async (req, res) => {
    try {
      const result = await updatePODTracking(parseInt(req.params.id as string));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Cancel order
  app.post('/api/admin/orders/:id/cancel', requireAdmin, async (req, res) => {
    try {
      const order = await prisma.order.findUnique({ where: { id: parseInt(req.params.id as string) } });
      if (!order) return res.status(404).json({ error: 'Commande introuvable' });

      await prisma.order.update({
        where: { id: order.id },
        data: { orderStatus: 'cancelled' },
      });

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // ADMIN — Products
  // ============================================================

  app.get('/api/admin/products', requireAdmin, async (req, res) => {
    try {
      const products = await prisma.product.findMany({
        include: { variants: true, images: true },
        orderBy: { id: 'asc' },
      });
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/admin/products/:id', requireAdmin, async (req, res) => {
    try {
      const { name, description, basePrice, isActive, supplier, supplierModel, supplierProductId } = req.body;
      const product = await prisma.product.update({
        where: { id: parseInt(req.params.id as string) },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(basePrice !== undefined && { basePrice }),
          ...(isActive !== undefined && { isActive }),
          ...(supplier !== undefined && { supplier }),
          ...(supplierModel !== undefined && { supplierModel }),
          ...(supplierProductId !== undefined && { supplierProductId }),
        },
      });
      res.json(product);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // ADMIN — Settings
  // ============================================================

  app.get('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
      const settings = await getAllSettings();
      // Never expose secrets
      const safe = { ...settings };
      delete safe.STRIPE_SECRET_KEY;
      res.json(safe);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
      const updates = req.body;
      for (const [key, value] of Object.entries(updates)) {
        await updateSetting(key, String(value));
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // ADMIN — POD Status
  // ============================================================

  app.get('/api/admin/pod/status', requireAdmin, async (req, res) => {
    try {
      const providers = ['Printful', 'Printify', 'Gelato'];
      const status = providers.map(name => {
        const provider = getPODProvider(name);
        return { name, configured: provider?.isConfigured || false };
      });
      res.json({ providers: status, stripe: isStripeConfigured(), email: isEmailConfigured() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // PUBLIC — Settings (non-secret)
  // ============================================================

  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await getAllSettings();
      res.json({
        siteName: settings.site_name || 'Resist N Co',
        siteEmail: settings.site_email || '',
        currency: settings.currency || 'CAD',
        shippingFlatRate: parseFloat(settings.shipping_flat_rate || '9.99'),
        shippingFreeThreshold: parseFloat(settings.shipping_free_threshold || '75'),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // ============================================================
  // SEO
  // ============================================================

  app.get('/sitemap.xml', async (req, res) => {
    try {
      const products = await prisma.product.findMany({ where: { isActive: true } });
      const siteUrl = process.env.SITE_URL || 'http://localhost:5000';
      const urls = [
        { loc: siteUrl, priority: '1.0' },
        { loc: `${siteUrl}/#/designer`, priority: '0.8' },
        ...products.map(p => ({ loc: `${siteUrl}/#/produit/${p.slug}`, priority: '0.9' })),
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>`;
      res.type('text/xml').send(xml);
    } catch (err: any) {
      res.status(500).send('Error');
    }
  });

  app.get('/robots.txt', (req, res) => {
    const siteUrl = process.env.SITE_URL || 'http://localhost:5000';
    res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\nDisallow: /admin\nDisallow: /api/admin\n`);
  });
}
