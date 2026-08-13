// ============================================================
// POD Provider Abstraction
// ============================================================

export interface PODProduct {
  id: string;
  name: string;
  variants: PODVariant[];
}

export interface PODVariant {
  id: string;
  size: string;
  color: string;
  inStock: boolean;
}

export interface PODOrderItem {
  productId: string;
  variantId: string;
  quantity: number;
  designUrl?: string;
  printFile?: Buffer;
}

export interface PODOrderResult {
  supplierOrderId: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
}

export interface PODProvider {
  name: string;
  isConfigured: boolean;

  getProducts(): Promise<PODProduct[]>;
  getProduct(productId: string): Promise<PODProduct | null>;
  getVariants(productId: string): Promise<PODVariant[]>;
  createOrder(orderId: string, items: PODOrderItem[], shipping: PODShippingAddress): Promise<PODOrderResult>;
  getOrder(supplierOrderId: string): Promise<PODOrderResult>;
  cancelOrder(supplierOrderId: string): Promise<boolean>;
  getTracking(supplierOrderId: string): Promise<PODOrderResult>;
  syncProducts(): Promise<void>;
}

export interface PODShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  phone?: string;
}

// ============================================================
// Factory
// ============================================================

import { PrintfulProvider } from './providers/printful';
import { PrintifyProvider } from './providers/printify';
import { GootenProvider } from './providers/gooten';
import { GelatoProvider } from './providers/gelato';

const providers: Record<string, PODProvider> = {};

export function getPODProvider(name: string): PODProvider | null {
  if (!providers[name]) {
    switch (name.toLowerCase()) {
      case 'printful':
        providers[name] = new PrintfulProvider();
        break;
      case 'printify':
        providers[name] = new PrintifyProvider();
        break;
      case 'gooten':
        providers[name] = new GootenProvider();
        break;
      case 'gelato':
        providers[name] = new GelatoProvider();
        break;
      default:
        return null;
    }
  }
  return providers[name];
}
