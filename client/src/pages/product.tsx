import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import productsData from "@/data/products.json";

export function ProductPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", slug],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/products/${slug}`);
        const data = await res.json();
        if (!data || !data.id) throw new Error("Invalid response");
        return data;
      } catch {
        return (productsData as Product[]).find((p) => p.slug === slug) || null;
      }
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 text-center">
        <h1 className="text-xl font-semibold mb-2">Produit introuvable</h1>
        <Link href="/">
          <Button variant="outline">Retour à la boutique</Button>
        </Link>
      </div>
    );
  }

  const colors: { name: string; hex: string }[] =
    typeof product.colors === "string" ? JSON.parse(product.colors) : (product.colors as any);
  const sizes: string[] =
    typeof product.sizes === "string" ? JSON.parse(product.sizes) : (product.sizes as any);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast({ title: "Veuillez choisir une taille", variant: "destructive" });
      return;
    }
    if (!selectedColor) {
      toast({ title: "Veuillez choisir une couleur", variant: "destructive" });
      return;
    }
    await addToCart({
      productId: product.id,
      quantity,
      size: selectedSize,
      color: selectedColor,
      designData: null,
      designPreview: null,
      price: product.basePrice,
      productName: product.name,
      productImage: product.imageUrl,
    });
    toast({ title: "Ajouté au panier", description: `${product.name} - ${selectedSize}, ${selectedColor}` });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Boutique</Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="relative">
          <Card className="overflow-hidden">
            <img
              src={typeof product.imageUrl === 'string' && product.imageUrl.startsWith('/') ? '.' + product.imageUrl : product.imageUrl}
              alt={product.name}
              className="w-full aspect-square object-cover"
            />
          </Card>
          <Badge className="absolute top-4 left-4" variant="secondary">
            Résist N Co · Engagement garanti
          </Badge>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h1 className="font-display text-2xl font-bold mb-2">{product.name}</h1>
          <p className="text-2xl font-semibold text-primary mb-4">{product.basePrice.toFixed(2)} $ CAD</p>
          <p className="text-sm text-muted-foreground mb-4">{product.description}</p>

          {/* Supplier info - hidden from public */}

          {/* Color selection */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Couleur</label>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                    selectedColor === c.name
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                  data-testid={`button-color-${c.name}`}
                >
                  <div
                    className="w-5 h-5 rounded-full border border-border"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-sm">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size selection */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Taille</label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`min-w-[3rem] px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedSize === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-muted-foreground"
                  }`}
                  data-testid={`button-size-${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Quantité</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-accent"
              >
                -
              </button>
              <span className="w-12 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-accent"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-auto">
            <Button
              size="lg"
              onClick={handleAddToCart}
              data-testid="button-add-cart"
            >
              Ajouter au panier · {(product.basePrice * quantity).toFixed(2)} $
            </Button>
            <Link href={`/designer?product=${product.slug}`}>
              <Button size="lg" variant="outline" className="w-full" data-testid="button-customize">
                Personnaliser ce produit
                <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" />
                  <circle cx="11" cy="11" r="2" />
                </svg>
              </Button>
            </Link>
          </div>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-border space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>
              Impression haute définition DTG
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9 6 9-6M3 7l9-4 9 4"/></svg>
              Livraison 5-10 jours ouvrables
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Retours acceptés sous 14 jours
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
