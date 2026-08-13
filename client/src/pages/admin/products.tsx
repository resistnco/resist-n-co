import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  category: string;
  basePrice: number;
  isActive: boolean;
  supplier?: string | null;
  supplierModel?: string | null;
  supplierCost?: number | null;
  variants?: unknown[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(value);
}

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingPrice, setEditingPrice] = useState<Record<number, string>>({});

  const { data: products, isLoading } = useQuery<AdminProduct[]>({
    queryKey: ["/api/admin/products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/products");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<AdminProduct> }) => {
      const res = await apiRequest("PATCH", `/api/admin/products/${id}`, patch);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Produit mis à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
    },
    onError: (err: any) => {
      toast({
        title: "Erreur",
        description: err?.message || "La mise à jour a échoué",
        variant: "destructive",
      });
    },
  });

  function toggleActive(product: AdminProduct) {
    updateMutation.mutate({ id: product.id, patch: { isActive: !product.isActive } });
  }

  function savePrice(product: AdminProduct) {
    const value = editingPrice[product.id];
    if (value === undefined) return;
    const num = parseFloat(value);
    if (Number.isNaN(num)) {
      toast({ title: "Prix invalide", variant: "destructive" });
      return;
    }
    updateMutation.mutate(
      { id: product.id, patch: { basePrice: num } },
      {
        onSuccess: () => {
          setEditingPrice((prev) => {
            const next = { ...prev };
            delete next[product.id];
            return next;
          });
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <h1
        className="font-display text-2xl font-bold uppercase tracking-wide"
        data-testid="admin-products-title"
      >
        Produits
      </h1>

      <Card className="border-border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Nom</TableHead>
                <TableHead className="text-muted-foreground">Catégorie</TableHead>
                <TableHead className="text-muted-foreground">Prix</TableHead>
                <TableHead className="text-muted-foreground">Fournisseur</TableHead>
                <TableHead className="text-muted-foreground">Coût fournisseur</TableHead>
                <TableHead className="text-muted-foreground">Marge</TableHead>
                <TableHead className="text-muted-foreground">Actif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!products || products.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucun produit trouvé
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const cost = product.supplierCost ?? 0;
                  const margin = product.basePrice - cost;
                  return (
                    <TableRow
                      key={product.id}
                      className="border-border"
                      data-testid={`admin-product-row-${product.id}`}
                    >
                      <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {product.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            data-testid={`admin-product-price-${product.id}`}
                            value={
                              editingPrice[product.id] !== undefined
                                ? editingPrice[product.id]
                                : product.basePrice.toFixed(2)
                            }
                            onChange={(e) =>
                              setEditingPrice((prev) => ({
                                ...prev,
                                [product.id]: e.target.value,
                              }))
                            }
                            className="bg-background border-border text-foreground w-24"
                          />
                          {editingPrice[product.id] !== undefined && (
                            <Button
                              size="sm"
                              data-testid={`admin-product-save-price-${product.id}`}
                              disabled={updateMutation.isPending}
                              onClick={() => savePrice(product)}
                              className="bg-primary text-primary-foreground"
                            >
                              OK
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {product.supplier || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {cost ? formatCurrency(cost) : "—"}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {formatCurrency(margin)}
                      </TableCell>
                      <TableCell>
                        <Switch
                          data-testid={`admin-product-active-${product.id}`}
                          checked={product.isActive}
                          disabled={updateMutation.isPending}
                          onCheckedChange={() => toggleActive(product)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export default AdminProductsPage;
