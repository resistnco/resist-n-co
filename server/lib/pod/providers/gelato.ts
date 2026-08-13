import { PODProvider, PODProduct, PODVariant, PODOrderItem, PODOrderResult, PODShippingAddress } from '../provider';

const GELATO_ORDER_API = 'https://order.gelatoapis.com/v4';
const GELATO_PRODUCT_API = 'https://product.gelatoapis.com/v1';

export class GelatoProvider implements PODProvider {
  name = 'Gelato';

  get apiKey(): string {
    return process.env.GELATO_API_KEY || '';
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  private async request(url: string, options: RequestInit = {}): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('GELATO_API_KEY not configured');
    }
    const res = await fetch(url, {
      ...options,
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gelato API error ${res.status}: ${body}`);
    }
    return res.json();
  }

  async getProducts(): Promise<PODProduct[]> {
    if (!this.isConfigured) return [];
    try {
      const data = await this.request(`${GELATO_PRODUCT_API}/products`);
      return (data.products || []).map((p: any) => ({
        id: String(p.id),
        name: p.title || p.name,
        variants: [],
      }));
    } catch {
      return [];
    }
  }

  async getProduct(productId: string): Promise<PODProduct | null> {
    if (!this.isConfigured) return null;
    try {
      const data = await this.request(`${GELATO_PRODUCT_API}/products/${productId}`);
      return { id: String(data.id), name: data.title || data.name, variants: [] };
    } catch {
      return null;
    }
  }

  async getVariants(productId: string): Promise<PODVariant[]> {
    if (!this.isConfigured) return [];
    try {
      const data = await this.request(`${GELATO_PRODUCT_API}/products/${productId}`);
      return (data.variants || []).map((v: any) => ({
        id: String(v.id),
        size: v.size || '',
        color: v.color || '',
        inStock: true,
      }));
    } catch {
      return [];
    }
  }

  async createOrder(orderId: string, items: PODOrderItem[], shipping: PODShippingAddress): Promise<PODOrderResult> {
    if (!this.isConfigured) {
      throw new Error('GELATO_API_KEY not configured — cannot send order to Gelato');
    }

    const body = {
      orderType: 'order',
      orderReferenceId: orderId,
      customerReferenceId: orderId,
      currency: 'CAD',
      items: items.map((item, idx) => ({
        itemReferenceId: `${orderId}-${idx}`,
        productId: item.productId,
        variantId: item.variantId || undefined,
        quantity: item.quantity,
      })),
      recipient: {
        name: shipping.name,
        address1: shipping.address1,
        address2: shipping.address2 || '',
        city: shipping.city,
        state: shipping.state,
        zip: shipping.zip,
        country: shipping.country,
        email: shipping.email,
        phone: shipping.phone || '',
      },
    };

    const data = await this.request(`${GELATO_ORDER_API}/orders`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return {
      supplierOrderId: data.id || data.orderId || orderId,
      status: data.status || 'sent',
      trackingNumber: data.fulfillments?.[0]?.shipment?.trackingNumber,
      trackingUrl: data.fulfillments?.[0]?.shipment?.trackingUrl,
      carrier: data.fulfillments?.[0]?.shipment?.carrier,
    };
  }

  async getOrder(supplierOrderId: string): Promise<PODOrderResult> {
    const data = await this.request(`${GELATO_ORDER_API}/orders/${supplierOrderId}`);
    return {
      supplierOrderId: data.id || supplierOrderId,
      status: data.status || 'unknown',
      trackingNumber: data.fulfillments?.[0]?.shipment?.trackingNumber,
      trackingUrl: data.fulfillments?.[0]?.shipment?.trackingUrl,
      carrier: data.fulfillments?.[0]?.shipment?.carrier,
    };
  }

  async cancelOrder(supplierOrderId: string): Promise<boolean> {
    try {
      await this.request(`${GELATO_ORDER_API}/orders/${supplierOrderId}/cancel`, { method: 'POST' });
      return true;
    } catch {
      return false;
    }
  }

  async getTracking(supplierOrderId: string): Promise<PODOrderResult> {
    return this.getOrder(supplierOrderId);
  }

  async syncProducts(): Promise<void> {
    // No-op: products are managed in DB
  }
}
