import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@shared/schema";
import productsData from "@/data/products.json";

export function HomePage() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/products");
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
        setApiStatus("Fallback (not array)");
        return productsData as Product[];
      } catch (e: any) {
        // Fallback to bundled data        return productsData as Product[];
      }
    },
  });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [
    { id: "tshirt", label: "T-Shirts" },
    { id: "hoodie", label: "Hoodies" },
    { id: "tuque", label: "Tuques" },
    { id: "accessory", label: "Accessoires" },
  ];

  const filteredProducts = activeCategory
    ? products?.filter((p) => p.category === activeCategory || (activeCategory === "tuque" && p.category === "accessory" && p.name.toLowerCase().includes("tuque")))
    : products;

  return (
    <div>
      {/* Hero section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 md:py-32">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4 uppercase tracking-wider">Militant · Écologiste · Antifasciste</Badge>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4 uppercase">
              Résistez.
              <span className="text-primary"> Habillez vos convictions.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-lg">
              Vêtements et accessoires aux logos engagés. T-shirts, hoodies, tuques et plus.
              Impression à la demande, coton biologique, livraison partout au Canada.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/designer">
                <Button size="lg" data-testid="button-start-design" className="uppercase tracking-wide font-semibold">
                  Créer mon design
                  <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('produits')?.scrollIntoView({ behavior: 'smooth' })} className="uppercase tracking-wide font-semibold">
                  Voir la collection
                </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", title: "Impression à la demande", desc: "Chaque pièce imprimée à la commande" },
              { icon: "M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z", title: "Paiement sécurisé", desc: "Stripe & Interac e-Transfer" },
              { icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9 6 9-6M3 7l9-4 9 4", title: "Livraison Canada", desc: "5-10 jours ouvrables" },
              { icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", title: "Coton biologique", desc: "Éthique et durable" },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide">{f.title}</h3>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products grid */}
      <section id="produits" className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-xl md:text-2xl font-bold uppercase">La Collection</h2>
          <div className="hidden md:flex gap-2">
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                className="cursor-pointer hover:bg-accent uppercase"
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const colors: { name: string; hex: string }[] =
    typeof product.colors === "string" ? JSON.parse(product.colors) : (product.colors as any);

  return (
    <Link href={`/produit/${product.slug}`} data-testid={`link-product-${product.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer h-full">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={typeof product.imageUrl === 'string' && product.imageUrl.startsWith('/') ? '.' + product.imageUrl : product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm uppercase tracking-wide">{product.name}</h3>
            <span className="font-semibold text-sm text-primary">{product.basePrice.toFixed(2)} $</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
          <div className="flex items-center gap-1">
            {colors.slice(0, 5).map((c, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
            {colors.length > 5 && (
              <span className="text-xs text-muted-foreground ml-1">+{colors.length - 5}</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
