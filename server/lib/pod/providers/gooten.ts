import { PODProvider, PODProduct, PODVariant, PODOrderItem, PODOrderResult, PODShippingAddress } from '../provider';

const GOOTEN_API_BASE = 'https://api.gooten.com/v1';

export class GootenProvider implements PODProvider {
  name = 'Gooten';

  get apiKey(): string {
    return process.env.GOOTEN_API_KEY || '';
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('GOOTEN_API_KEY not configured');
    }
    const separator = path.includes('?') ? '&' : '?';
    const res = await fetch(`${GOOTEN_API_BASE}${path}${separator}apikey=${this.apiKey}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gooten API error ${res.status}: ${body}`);
    }
    return res.json();
  }

  async getProducts(): Promise<PODProduct[]> {
    if (!this.isConfigured) return [];
    const data = await this.request('/products');
    return (data.Products || []).map((p: any) => ({
      id: String(p.Id),
      name: p.Name,
      variants: [],
    }));
  }

  async getProduct(productId: string): Promise<PODProduct | null> {
    if (!this.isConfigured) return null;
    const data = await this.request(`/products/${productId}`);
    const p = data.Product;
    return { id: String(p.Id), name: p.Name, variants: [] };
  }

  async getVariants(productId: string): Promise<PODVariant[]> {
    if (!this.isConfigured) return [];
    const data = await this.request(`/products/${productId}/skus`);
    return (data.Skus || []).map((s: any) => ({
      id: String(s.Sku),
      size: s.Size || '',
      color: s.Color || '',
      inStock: s.Available !== false,
    }));
  }

  async createOrder(orderId: string, items: PODOrderItem[], shipping: PODShippingAddress): Promise<PODOrderResult> {
    if (!this.isConfigured) {
      throw new Error('Gooten not configured — cannot send order');
    }
    const body = {
      OrderId: orderId,
      ShipToAddress: {
        FirstName: shipping.name.split(' ')[0],
        LastName: shipping.name.split(' ').slice(1).join(' '),
        Address1: shipping.address1,
        Address2: shipping.address2 || '',
        City: shipping.city,
        State: shipping.state,
        Zip: shipping.zip,
        Country: shipping.country,
        Email: shipping.email,
        Phone: shipping.phone || '',
      },
      Items: items.map(item => ({
        ProductId: item.productId,
        Sku: item.variantId,
        Quantity: item.quantity,
      })),
    };
    const data = await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return {
      supplierOrderId: String(data.OrderId || ''),
      status: data.Status || 'pending',
    };
  }

  async getOrder(supplierOrderId: string): Promise<PODOrderResult> {
    if (!this.isConfigured) return { supplierOrderId, status: 'unknown' };
    const data = await this.request(`/orders/${supplierOrderId}`);
    return {
      supplierOrderId,
      status: data.Status || 'unknown',
      trackingNumber: data.TrackingNumber,
      trackingUrl: data.TrackingUrl,
      carrier: data.Carrier,
    };
  }

  async cancelOrder(supplierOrderId: string): Promise<boolean> {
    if (!this.isConfigured) return false;
    await this.request(`/orders/${supplierOrderId}/cancel`, { method: 'POST' });
    return true;
  }

  async getTracking(supplierOrderId: string): Promise<PODOrderResult> {
    return this.getOrder(supplierOrderId);
  }

  async syncProducts(): Promise<void> {
    if (!this.isConfigured) return;
    console.log('[Gooten] Syncing products...');
    const products = await this.getProducts();
    console.log(`[Gooten] Found ${products.length} products`);
  }
}
