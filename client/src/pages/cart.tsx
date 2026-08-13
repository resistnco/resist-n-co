import { Link } from "wouter";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Product } from "@shared/schema";
import productsData from "@/data/products.json";

export function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  // Use bundled product data
  const products = productsData as Product[];

  // Enrich cart items with product info
  const enrichedItems = items.map((item) => {
    const product = products.find((p: any) => p.id === item.productId);
    const img = product?.imageUrl || item.productImage || "";
    return {
      ...item,
      productName: product?.name || item.productName || "Produit",
      productImage: typeof img === 'string' && img.startsWith('/') ? '.' + img : img,
    };
  });

  const shipping = subtotal > 75 ? 0 : 9.99;
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
        <h1 className="font-display text-xl font-bold mb-2">Votre panier est vide</h1>
        <p className="text-sm text-muted-foreground mb-6">Découvrez nos produits ou créez votre design personnalisé.</p>
        <div className="flex justify-center gap-3">
          <Link href="/"><Button>Parcourir la boutique</Button></Link>
          <Link href="/designer"><Button variant="outline">Créer un design</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <h1 className="font-display text-xl md:text-2xl font-bold mb-6">Mon panier ({items.length})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {enrichedItems.map((item) => (
            <Card key={item.id} className="p-4 flex gap-4">
              {/* Image or design preview */}
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {item.designPreview ? (
                  <img src={item.designPreview} alt="Mon design" className="w-full h-full object-cover" />
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
                      <span>Taille: {item.size}</span>
                      <span>·</span>
                      <span>Couleur: {item.color}</span>
                      {item.designData && (
                        <>
                          <span>·</span>
                          <span className="text-primary font-medium">Personnalisé</span>
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
                    Supprimer
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="p-5 sticky top-20">
            <h2 className="font-semibold text-sm mb-4">Résumé</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span>{subtotal.toFixed(2)} $</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livraison</span>
                <span>{shipping === 0 ? "Gratuite" : `${shipping.toFixed(2)} $`}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted-foreground">Livraison gratuite à partir de 75 $</p>
              )}
              <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold text-base">
                <span>Total</span>
                <span className="text-primary">{total.toFixed(2)} $ CAD</span>
              </div>
            </div>
            <Link href="/checkout">
              <Button size="lg" className="w-full mt-4" data-testid="button-checkout">
                Passer la commande
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="w-full mt-2">
                Continuer mes achats
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
