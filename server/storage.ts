import { products, cartItems, orders } from '@shared/schema';
import type { Product, InsertProduct, CartItem, InsertCartItem, Order, InsertOrder } from '@shared/schema';
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Auto-create tables on startup
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    base_price REAL NOT NULL,
    image_url TEXT NOT NULL,
    colors TEXT NOT NULL DEFAULT '[]',
    sizes TEXT NOT NULL DEFAULT '[]',
    supplier TEXT NOT NULL DEFAULT '',
    supplier_model TEXT NOT NULL DEFAULT '',
    supplier_cost REAL NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    design_data TEXT,
    design_preview TEXT,
    price REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT NOT NULL,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    shipping REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    fulfillment_status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed products — Resist N Co activist streetwear
// Suppliers: Printful, Printify, Gelato
// Models verified from official supplier catalogs
// Popular colors based on Printful/Printify sales data: black, white, navy, dark heather, sport grey, forest green
const existingProducts = sqlite.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (existingProducts.count === 0) {
  const seedProducts = [
    {
      name: "T-Shirt « Resist »",
      slug: "tshirt-resist",
      description: "Poing levé tenant une pousse verte, texte RESIST. Impression DTG blanc et rouge. Un manifeste à porter.",
      category: "tshirt",
      base_price: 29.99,
      image_url: "/products/tshirt-resist.jpg",
      colors: JSON.stringify([
        { name: "Black", hex: "#1a1a1a" },
        { name: "Navy", hex: "#1a2b4a" },
        { name: "Dark Grey Heather", hex: "#3a3a3a" },
        { name: "Heather Forest", hex: "#1a3a2a" },
        { name: "Maroon", hex: "#5a1a2a" },
      ]),
      sizes: JSON.stringify(["XS", "S", "M", "L", "XL", "2XL", "3XL"]),
      supplier: "Printful",
      supplier_model: "Bella+Canvas 3001",
      supplier_cost: 11.69,
    },
    {
      name: "T-Shirt « Antifascist Action »",
      slug: "tshirt-antifascist",
      description: "Trois flèches antifascistes en cercle rouge, texte ANTIFASCIST ACTION. Toujours relevant, malheureusement.",
      category: "tshirt",
      base_price: 29.99,
      image_url: "/products/tshirt-antifa.jpg",
      colors: JSON.stringify([
        { name: "Black", hex: "#1a1a1a" },
        { name: "White", hex: "#f5f0e8" },
        { name: "Red", hex: "#8a1a1a" },
        { name: "Navy", hex: "#1a2b4a" },
        { name: "Athletic Heather", hex: "#8a8a8a" },
      ]),
      sizes: JSON.stringify(["XS", "S", "M", "L", "XL", "2XL", "3XL"]),
      supplier: "Printify",
      supplier_model: "Bella+Canvas 3001",
      supplier_cost: 11.29,
    },
    {
      name: "T-Shirt « Solidarity »",
      slug: "tshirt-solidarity",
      description: "Poings levés de différentes tailles s'entrelaçant en cercle, texte SOLIDARITY. L'union fait la force.",
      category: "tshirt",
      base_price: 29.99,
      image_url: "/products/tshirt-solidarity.jpg",
      colors: JSON.stringify([
        { name: "Black", hex: "#1a1a1a" },
        { name: "Dark Grey Heather", hex: "#3a3a3a" },
        { name: "Heather Forest", hex: "#1a3a2a" },
        { name: "Maroon", hex: "#5a1a2a" },
        { name: "Navy", hex: "#1a2b4a" },
      ]),
      sizes: JSON.stringify(["XS", "S", "M", "L", "XL", "2XL", "3XL"]),
      supplier: "Gelato",
      supplier_model: "Bella+Canvas 3001",
      supplier_cost: 10.69,
    },
    {
      name: "Hoodie « Climate Justice »",
      slug: "hoodie-climate-justice",
      description: "Mains soutenant la Terre, texte CLIMATE JUSTICE NOW. Il n'y a pas de planète B. Doublure polaire, capuche ajustable.",
      category: "hoodie",
      base_price: 54.99,
      image_url: "/products/hoodie-climate.jpg",
      colors: JSON.stringify([
        { name: "Black", hex: "#1a1a1a" },
        { name: "Navy", hex: "#1a2b4a" },
        { name: "Dark Heather", hex: "#3a3a3a" },
        { name: "Heather Forest", hex: "#1a3a2a" },
        { name: "Sport Grey", hex: "#9a9a9a" },
      ]),
      sizes: JSON.stringify(["S", "M", "L", "XL", "2XL", "3XL"]),
      supplier: "Printful",
      supplier_model: "Gildan 18500",
      supplier_cost: 22.19,
    },
    {
      name: "Hoodie « No Pasarán »",
      slug: "hoodie-no-pasaran",
      description: "Texte NO PASARÁN en fil de fer barbelé, chaîne brisée. Ils ne passeront pas. Capuche ajustable, poches kangourou.",
      category: "hoodie",
      base_price: 54.99,
      image_url: "/products/hoodie-nopasaran.jpg",
      colors: JSON.stringify([
        { name: "Black", hex: "#1a1a1a" },
        { name: "Navy", hex: "#1a2b4a" },
        { name: "Maroon", hex: "#5a1a2a" },
        { name: "Dark Heather", hex: "#3a3a3a" },
        { name: "Sport Grey", hex: "#9a9a9a" },
      ]),
      sizes: JSON.stringify(["S", "M", "L", "XL", "2XL", "3XL"]),
      supplier: "Printify",
      supplier_model: "Gildan 18500",
      supplier_cost: 21.58,
    },
    {
      name: "Tuque « Power to the People »",
      slug: "tuque-power-people",
      description: "Tuque tricot 100% acrylique, doublure polaire. Texte POWER TO THE PEOPLE brodé sur le rebord rabattu. Chaleur et conviction.",
      category: "accessory",
      base_price: 24.99,
      image_url: "/products/tuque-power.jpg",
      colors: JSON.stringify([
        { name: "Black", hex: "#1a1a1a" },
        { name: "Navy", hex: "#1a2b4a" },
        { name: "Dark Grey", hex: "#3a3a3a" },
        { name: "Maroon", hex: "#5a1a2a" },
      ]),
      sizes: JSON.stringify(["Unique"]),
      supplier: "Printful",
      supplier_model: "Cuffed Knit Beanie",
      supplier_cost: 12.95,
    },
    {
      name: "Tasse « Defend the Earth »",
      slug: "mug-defend-earth",
      description: "Mug céramique 11oz, émail premium. Bouclier vert avec arbre et racines, texte DEFEND THE EARTH. Compatible lave-vaisselle et micro-ondes.",
      category: "accessory",
      base_price: 16.99,
      image_url: "/products/mug-defend.jpg",
      colors: JSON.stringify([
        { name: "White", hex: "#f5f0e8" },
        { name: "Black", hex: "#1a1a1a" },
      ]),
      sizes: JSON.stringify(["11oz"]),
      supplier: "Gelato",
      supplier_model: "Ceramic Mug 11oz",
      supplier_cost: 4.93,
    },
    {
      name: "Sous-verre « Organize »",
      slug: "coaster-organize",
      description: "Set de 4 sous-verres en liège naturel, diamètre 10cm. Poing levé en cercle, texte ORGANIZE. Résistant à l'eau, antidérapant. Organisez-vous.",
      category: "accessory",
      base_price: 14.99,
      image_url: "/products/coaster-organize.jpg",
      colors: JSON.stringify([
        { name: "Natural Cork", hex: "#c4a882" },
        { name: "Black", hex: "#1a1a1a" },
      ]),
      sizes: JSON.stringify(["Set de 4"]),
      supplier: "Printify",
      supplier_model: "Cork-Backed Coaster",
      supplier_cost: 3.50,
    },
  ];

  for (const p of seedProducts) {
    sqlite.prepare(
      `INSERT INTO products (name, slug, description, category, base_price, image_url, colors, sizes, supplier, supplier_model, supplier_cost, is_active) 
       VALUES (@name, @slug, @description, @category, @base_price, @image_url, @colors, @sizes, @supplier, @supplier_model, @supplier_cost, 1)`
    ).run(p);
  }
}

export interface IStorage {
  getProducts(): Product[];
  getProduct(id: number): Product | undefined;
  getProductBySlug(slug: string): Product | undefined;
  createProduct(product: InsertProduct): Product;
  getCartItems(visitorId: string): CartItem[];
  addCartItem(item: InsertCartItem): CartItem;
  updateCartItemQuantity(id: number, quantity: number): void;
  removeCartItem(id: number): void;
  clearCart(visitorId: string): void;
  createOrder(order: InsertOrder): Order;
  getOrder(id: number): Order | undefined;
  getOrdersByVisitor(visitorId: string): Order[];
}

export class DatabaseStorage implements IStorage {
  getProducts(): Product[] {
    return db.select().from(products).all();
  }

  getProduct(id: number): Product | undefined {
    return db.select().from(products).where(eq(products.id, id)).get();
  }

  getProductBySlug(slug: string): Product | undefined {
    return db.select().from(products).where(eq(products.slug, slug)).get();
  }

  createProduct(product: InsertProduct): Product {
    return db.insert(products).values(product).returning().get();
  }

  getCartItems(visitorId: string): CartItem[] {
    return db.select().from(cartItems).where(eq(cartItems.visitorId, visitorId)).all();
  }

  addCartItem(item: InsertCartItem): CartItem {
    return db.insert(cartItems).values(item).returning().get();
  }

  updateCartItemQuantity(id: number, quantity: number): void {
    db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).run();
  }

  removeCartItem(id: number): void {
    db.delete(cartItems).where(eq(cartItems.id, id)).run();
  }

  clearCart(visitorId: string): void {
    db.delete(cartItems).where(eq(cartItems.visitorId, visitorId)).run();
  }

  createOrder(order: InsertOrder): Order {
    return db.insert(orders).values(order).returning().get();
  }

  getOrder(id: number): Order | undefined {
    return db.select().from(orders).where(eq(orders.id, id)).get();
  }

  getOrdersByVisitor(visitorId: string): Order[] {
    return db.select().from(orders).where(eq(orders.visitorId, visitorId)).all();
  }
}

export const storage = new DatabaseStorage();
