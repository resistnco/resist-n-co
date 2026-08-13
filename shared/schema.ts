import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import type * as z from "zod/mini";

// Products (garments available for customization)
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // tshirt, hoodie, accessory
  basePrice: real("base_price").notNull(),
  imageUrl: text("image_url").notNull(),
  colors: text("colors").notNull().default("[]"), // JSON array of {name, hex}
  sizes: text("sizes").notNull().default("[]"), // JSON array of sizes
  supplier: text("supplier").notNull().default(""), // Printful, Printify, Gelato
  supplierModel: text("supplier_model").notNull().default(""), // e.g. Bella+Canvas 3001
  supplierCost: real("supplier_cost").notNull().default(0), // base cost from supplier
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

// Cart items (per visitor)
export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  visitorId: text("visitor_id").notNull(),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  size: text("size").notNull(),
  color: text("color").notNull(),
  designData: text("design_data"), // JSON of canvas design (for custom items)
  designPreview: text("design_preview"), // base64 PNG preview
  price: real("price").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// Orders
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  visitorId: text("visitor_id").notNull(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  shippingAddress: text("shipping_address").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  postalCode: text("postal_code").notNull(),
  items: text("items").notNull(), // JSON array of items
  subtotal: real("subtotal").notNull(),
  shipping: real("shipping").notNull().default(0),
  total: real("total").notNull(),
  paymentMethod: text("payment_method").notNull(), // stripe or interac
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed
  fulfillmentStatus: text("fulfillment_status").notNull().default("pending"), // pending, printed, shipped, delivered
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

// Insert schemas
export const insertProductSchema = createInsertSchema(products);
export const insertCartItemSchema = createInsertSchema(cartItems);
export const insertOrderSchema = createInsertSchema(orders);

// Types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
