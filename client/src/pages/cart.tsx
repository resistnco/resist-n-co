import { Link } from "wouter";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Product } from "@shared/schema";
import productsData from "@/data/products.json";
import { useI18n } from "@/lib/i18n";
import { localizeProduct } from "@/lib/productTranslations";

export function CartPage() {
  const { t, lang } = useI18n();
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  // Use bundled product data
  const products = productsData as Product[];

  // Enrich cart items with product info
  const enrichedItems = items.map((item) => {
    const product = products.find((p: any) => p.id === item.productId);
    const img = product?.imageUrl || item.productImage || "";
    const localized = product ? localizeProduct(product, lang) : { name: item.productName, description: "" };
    return {
      ...item,
      productName: localized.name || item.productName || t("cart.product"),
      productImage: typeof img === 'string' && img.startsWith('/') ? '.' + img : img,
    };
  });

  const shipping = subtotal > 75 ? 0 : 17.99;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <svg className="w-10 h-10 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-bold mb-2">{t("cart.empty")}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t("cart.emptyDesc")}</p>
        <div className="flex justify-center gap-3">
          <Link href="/"><Button>{t("cart.browse")}</Button></Link>
          <Link href="/designer"><Button variant="outline">{t("designer.title")}</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <h1 className="font-display text-xl md:text-2xl font-bold mb-6">{t("cart.title")} ({items.length})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {enrichedItems.map((item) => (
            <Card key={item.id} className="p-4 flex gap-4">
              {/* Image or design preview */}
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {item.designPreview ? (
                  <img src={item.designPreview} alt={t("designer.title")} className="w-full h-full object-cover" />
                ) : (
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm">{item.productName}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{t("product.size")}: {item.size}</span>
                      <span>·</span>
                      <span>{t("product.color")}: {item.color}</span>
                      {item.designData && (
                        <>
                          <span>·</span>
                          <span className="text-primary font-medium">{t("designer.title")}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-sm">{(item.price * item.quantity).toFixed(2)} $</span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-accent text-sm"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-md border border-border flex items-center justify-center hover:bg-accent text-sm"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    data-testid={`button-remove-item-${item.id}`}
                  >
                    {t("cart.remove")}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="p-5 sticky top-20">
            <h2 className="font-semibold text-sm mb-4">{t("checkout.summary")}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                <span>{subtotal.toFixed(2)} $</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("cart.shipping")}</span>
                <span>{shipping === 0 ? t("cart.free") : `${shipping.toFixed(2)} $`}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground">{t("cart.freeThreshold")}</p>
              )}
              <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold text-base">
                <span>{t("cart.total")}</span>
                <span className="text-primary">{total.toFixed(2)} $ CAD</span>
              </div>
            </div>
            <Link href="/checkout">
              <Button size="lg" className="w-full mt-4" data-testid="button-checkout">
                {t("cart.checkout")}
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="w-full mt-2">
                {t("paySuccess.continueShopping")}
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
