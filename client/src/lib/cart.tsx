// Cart context — manages cart state across the app without localStorage or backend API
import { createContext, useContext, useState, useCallback } from "react";
import productsData from "@/data/products.json";

export interface CartItemData {
  id: number;
  productId: number;
  quantity: number;
  size: string;
  color: string;
  designData: string | null;
  designPreview: string | null;
  price: number;
  productName?: string;
  productImage?: string;
}

interface CartContextValue {
  items: CartItemData[];
  visitorId: string;
  isLoading: boolean;
  addToCart: (item: Omit<CartItemData, "id" | "visitorId">) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  refreshCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  visitorId: "",
  isLoading: false,
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  refreshCart: async () => {},
  totalItems: 0,
  subtotal: 0,
});

// Generate a persistent visitor ID using in-memory state
function getVisitorId(): string {
  if (typeof window === "undefined") return "server";
  if ((window as any).__visitorId) {
    return (window as any).__visitorId;
  }
  const id = `v_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
  (window as any).__visitorId = id;
  return id;
}

let cartIdCounter = 1;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemData[]>([]);
  const [visitorId] = useState(getVisitorId);

  const addToCart = useCallback(async (item: Omit<CartItemData, "id" | "visitorId">) => {
    const products = productsData as any[];
    const product = products.find((p) => p.id === item.productId);
    const newItem: CartItemData = {
      ...item,
      id: cartIdCounter++,
      visitorId,
      productName: product?.name || item.productName,
      productImage: product?.imageUrl || item.productImage,
    };
    setItems((prev) => {
      // Check if same product+size+color already in cart
      const existing = prev.find(
        (i) => i.productId === newItem.productId && i.size === newItem.size && i.color === newItem.color
      );
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + newItem.quantity } : i
        );
      }
      return [...prev, newItem];
    });
  }, [visitorId]);

  const updateQuantity = useCallback(async (id: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    }
  }, []);

  const removeItem = useCallback(async (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const refreshCart = useCallback(async () => {
    // No-op: cart is managed in React state
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      visitorId,
      isLoading: false,
      addToCart,
      updateQuantity,
      removeItem,
      refreshCart,
      totalItems,
      subtotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
