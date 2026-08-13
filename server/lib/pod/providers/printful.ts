import { PODProvider, PODProduct, PODVariant, PODOrderItem, PODOrderResult, PODShippingAddress } from '../provider';

const PRINTFUL_API_BASE = 'https://api.printful.com';

export class PrintfulProvider implements PODProvider {
  name = 'Printful';

  get apiKey(): string {
    return process.env.PRINTFUL_API_KEY || '';
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('PRINTFUL_API_KEY not configured');
    }
    const res = await fetch(`${PRINTFUL_API_BASE}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Printful API error ${res.status}: ${body}`);
    }
    const json = await res.json();
    return json;
  }

  async getProducts(): Promise<PODProduct[]> {
    if (!this.isConfigured) return [];
    const data = await this.request('/store/products');
    return (data.result || []).map((p: any) => ({
      id: String(p.id),
      name: p.name,
      variants: [],
    }));
  }

  async getProduct(productId: string): Promise<PODProduct | null> {
    if (!this.isConfigured) return null;
    const data = await this.request(`/store/products/${productId}`);
    const p = data.result;
    return { id: String(p.id), name: p.name, variants: [] };
  }

  async getVariants(productId: string): Promise<PODVariant[]> {
    if (!this.isConfigured) return [];
    const data = await this.request(`/store/products/${productId}`);
    return (data.result?.sync_variants || []).map((v: any) => ({
      id: String(v.id),
      size: v.size || '',
      color: v.color || '',
      inStock: v.availability?.status === 'active',
    }));
  }

  async createOrder(orderId: string, items: PODOrderItem[], shipping: PODShippingAddress): Promise<PODOrderResult> {
    if (!this.isConfigured) {
      throw new Error('PRINTFUL_API_KEY not configured — cannot send order to Printful');
    }
    const body = {
      external_id: orderId,
      shipping: shipping.name,
      recipient: {
        name: shipping.name,
        address1: shipping.address1,
        address2: shipping.address2 || '',
        city: shipping.city,
        state_code: shipping.state,
        zip: shipping.zip,
        country: shipping.country,
        email: shipping.email,
        phone: shipping.phone || '',
      },
      items: items.map(item => ({
        sync_product_id: parseInt(item.productId),
        sync_variant_id: parseInt(item.variantId),
        quantity: item.quantity,
      })),
    };
    const data = await this.request('/store/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return {
      supplierOrderId: String(data.result?.id || ''),
      status: data.result?.status || 'pending',
    };
  }

  async getOrder(supplierOrderId: string): Promise<PODOrderResult> {
    if (!this.isConfigured) return { supplierOrderId, status: 'unknown' };
    const data = await this.request(`/store/orders/${supplierOrderId}`);
    const order = data.result;
    return {
      supplierOrderId,
      status: order?.status || 'unknown',
      trackingNumber: order?.shipment?.tracking_number,
      trackingUrl: order?.shipment?.tracking_url,
      carrier: order?.shipment?.carrier,
    };
  }

  async cancelOrder(supplierOrderId: string): Promise<boolean> {
    if (!this.isConfigured) return false;
    await this.request(`/store/orders/${supplierOrderId}`, { method: 'DELETE' });
    return true;
  }

  async getTracking(supplierOrderId: string): Promise<PODOrderResult> {
    return this.getOrder(supplierOrderId);
  }

  async syncProducts(): Promise<void> {
    if (!this.isConfigured) return;
    // Sync logic: fetch products and update local DB
    console.log('[Printful] Syncing products...');
    const products = await this.getProducts();
    console.log(`[Printful] Found ${products.length} products`);
  }
}
