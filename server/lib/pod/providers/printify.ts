import { PODProvider, PODProduct, PODVariant, PODOrderItem, PODOrderResult, PODShippingAddress } from '../provider';

const PRINTIFY_API_BASE = 'https://api.printify.com/v1';

export class PrintifyProvider implements PODProvider {
  name = 'Printify';

  get apiToken(): string {
    return process.env.PRINTIFY_API_TOKEN || '';
  }

  get shopId(): string {
    return process.env.PRINTIFY_SHOP_ID || '';
  }

  get isConfigured(): boolean {
    return !!this.apiToken && !!this.shopId;
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID not configured');
    }
    const res = await fetch(`${PRINTIFY_API_BASE}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Printify API error ${res.status}: ${body}`);
    }
    return res.json();
  }

  async getProducts(): Promise<PODProduct[]> {
    if (!this.isConfigured) return [];
    const data = await this.request(`/shops/${this.shopId}/products.json`);
    return (data.data || []).map((p: any) => ({
      id: String(p.id),
      name: p.title,
      variants: [],
    }));
  }

  async getProduct(productId: string): Promise<PODProduct | null> {
    if (!this.isConfigured) return null;
    const data = await this.request(`/shops/${this.shopId}/products/${productId}.json`);
    return { id: String(data.id), name: data.title, variants: [] };
  }

  async getVariants(productId: string): Promise<PODVariant[]> {
    if (!this.isConfigured) return [];
    const data = await this.request(`/shops/${this.shopId}/products/${productId}.json`);
    return (data.variants || []).map((v: any) => ({
      id: String(v.id),
      size: v.size || '',
      color: v.color || '',
      inStock: v.is_enabled,
    }));
  }

  async createOrder(orderId: string, items: PODOrderItem[], shipping: PODShippingAddress): Promise<PODOrderResult> {
    if (!this.isConfigured) {
      throw new Error('Printify not configured — cannot send order');
    }
    // Split name into first/last for Printify
    const nameParts = (shipping.name || 'Customer').trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const body = {
      external_id: orderId,
      shipping_method: 1, // Standard shipping
      address_to: {
        first_name: firstName,
        last_name: lastName,
        email: shipping.email || '',
        phone: shipping.phone || '',
        country: (shipping.country || 'CA') === 'Canada' ? 'CA' : (shipping.country || 'CA'),
        region: shipping.state || '',
        address1: shipping.address1 || '',
        address2: shipping.address2 || '',
        city: shipping.city || '',
        zip: shipping.zip || '',
      },
      line_items: items.map(item => ({
        product_id: String(item.productId),
        variant_id: parseInt(item.variantId),
        quantity: item.quantity,
      })),
    };
    const data = await this.request(`/shops/${this.shopId}/orders.json`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return {
      supplierOrderId: String(data.id || ''),
      status: data.status || 'pending',
    };
  }

  async getOrder(supplierOrderId: string): Promise<PODOrderResult> {
    if (!this.isConfigured) return { supplierOrderId, status: 'unknown' };
    const data = await this.request(`/shops/${this.shopId}/orders/${supplierOrderId}.json`);
    return {
      supplierOrderId,
      status: data.status || 'unknown',
      trackingNumber: data.tracking_number,
      trackingUrl: data.tracking_url,
      carrier: data.carrier,
    };
  }

  async cancelOrder(supplierOrderId: string): Promise<boolean> {
    if (!this.isConfigured) return false;
    await this.request(`/shops/${this.shopId}/orders/${supplierOrderId}/cancel.json`, { method: 'POST' });
    return true;
  }

  async getTracking(supplierOrderId: string): Promise<PODOrderResult> {
    return this.getOrder(supplierOrderId);
  }

  async syncProducts(): Promise<void> {
    if (!this.isConfigured) return;
    console.log('[Printify] Syncing products...');
    const products = await this.getProducts();
    console.log(`[Printify] Found ${products.length} products`);
  }
}
