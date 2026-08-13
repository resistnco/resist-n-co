import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Package, ShoppingBag } from "lucide-react";

type OrderItem = {
  id: number;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type Order = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  subtotal: number;
  shipping: number;
  taxes: number;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  items: OrderItem[];
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  awaiting_payment: "En attente de paiement",
  paid: "Payée",
  processing: "En traitement",
  printed: "Imprimée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

export function PaymentSuccessPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const orderNumber = params.get("order") || "";

  const { data: order, isLoading, isError } = useQuery<Order>({
    queryKey: ["/api/orders", orderNumber],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/orders/${orderNumber}`);
      return res.json();
    },
    enabled: !!orderNumber,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Hero confirmation */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-9 h-9 text-red-600" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight mb-3">
            Paiement confirmé
          </h1>
          <p className="text-muted-foreground">
            Merci pour votre commande ! Un courriel de confirmation a été envoyé.
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Order number banner */}
            <div className="bg-red-600/5 border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Numéro de commande
                </p>
                <p className="font-display font-bold text-lg text-red-600 break-all">
                  {orderNumber || "—"}
                </p>
              </div>
              <Package className="w-8 h-8 text-red-600/60" />
            </div>

            {/* Order details */}
            <div className="px-6 py-6">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-3/4" />
                </div>
              ) : isError || !order ? (
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">
                    Impossible de récupérer les détails de la commande. Votre paiement a
                    néanmoins été reçu.
                  </p>
                  <p>
                    Conservez votre numéro de commande pour toute référence future.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Status */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Statut</span>
                    <span className="font-semibold text-red-600">
                      {STATUS_LABELS[order.orderStatus] || order.orderStatus}
                    </span>
                  </div>

                  {/* Items summary */}
                  {order.items && order.items.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                        Articles
                      </p>
                      <ul className="space-y-2">
                        {order.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-start justify-between text-sm gap-3"
                          >
                            <span className="text-foreground">
                              {item.productName}
                              {item.size ? ` — ${item.size}` : ""}
                              {item.color ? ` — ${item.color}` : ""}
                              <span className="text-muted-foreground"> ×{item.quantity}</span>
                            </span>
                            <span className="font-medium whitespace-nowrap">
                              {item.totalPrice.toFixed(2)} $
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Totals */}
                  <div className="border-t border-border pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Sous-total</span>
                      <span>{order.subtotal.toFixed(2)} $</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Expédition</span>
                      <span>
                        {order.shipping === 0 ? "Gratuite" : `${order.shipping.toFixed(2)} $`}
                      </span>
                    </div>
                    {order.taxes > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Taxes</span>
                        <span>{order.taxes.toFixed(2)} $</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                      <span>Total</span>
                      <span className="text-red-600">{order.total.toFixed(2)} $</span>
                    </div>
                  </div>

                  {/* Shipping info */}
                  <div className="bg-muted/40 rounded-lg px-4 py-3 text-sm text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Livraison à :</span>{" "}
                      {order.customerName}
                    </p>
                    <p className="mt-1">
                      Délai estimé : 2 à 7 jours de production, puis 3 à 10 jours ouvrables
                      d'expédition.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link href="/" className="flex-1">
            <Button size="lg" className="w-full uppercase tracking-wide font-semibold">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Continuer mes achats
            </Button>
          </Link>
          <Link href="/panier" className="flex-1">
            <Button size="lg" variant="outline" className="w-full uppercase tracking-wide font-semibold">
              Voir mon panier
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Un problème avec votre commande ? Écrivez-nous à{" "}
          <a
            href="mailto:support@resistnco.ca"
            className="text-red-600 hover:underline"
          >
            support@resistnco.ca
          </a>
        </p>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
