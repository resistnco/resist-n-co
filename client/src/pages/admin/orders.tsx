import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface AdminOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  items?: OrderItem[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "paid", label: "Payées" },
  { value: "processing", label: "En traitement" },
  { value: "printed", label: "Imprimées" },
  { value: "shipped", label: "Expédiées" },
  { value: "delivered", label: "Livrées" },
  { value: "cancelled", label: "Annulées" },
];

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-CA", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(value);
}

function paymentStatusBadge(status: string) {
  const map: Record<string, "secondary" | "default" | "destructive"> = {
    paid: "default",
    pending: "secondary",
    failed: "destructive",
    refunded: "destructive",
  };
  return map[status] || "secondary";
}

function orderStatusBadge(status: string) {
  const map: Record<string, "secondary" | "default" | "destructive"> = {
    shipped: "default",
    delivered: "default",
    paid: "default",
    cancelled: "destructive",
    refunded: "destructive",
  };
  return map[status] || "secondary";
}

export function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const queryKey = [
    "/api/admin/orders",
    { status: status === "all" ? undefined : status, search: search || undefined },
  ];

  const { data: orders, isLoading } = useQuery<AdminOrder[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      if (search) params.set("search", search);
      const qs = params.toString();
      const res = await apiRequest("GET", `/api/admin/orders${qs ? `?${qs}` : ""}`);
      return res.json();
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: string }) => {
      const res = await apiRequest("POST", `/api/admin/orders/${id}/${action}`);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      toast({ title: "Action effectuée", description: `Action « ${variables.action} » réussie` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
    },
    onError: (err: any) => {
      toast({
        title: "Erreur",
        description: err?.message || "L'action a échoué",
        variant: "destructive",
      });
    },
  });

  function handleAction(id: number, action: string) {
    actionMutation.mutate({ id, action });
  }

  return (
    <div className="space-y-6">
      <h1
        className="font-display text-2xl font-bold uppercase tracking-wide"
        data-testid="admin-orders-title"
      >
        Commandes
      </h1>

      {/* Filters */}
      <Card className="border-border bg-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Rechercher par numéro de commande..."
            data-testid="admin-orders-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-background border-border text-foreground sm:max-w-xs"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger
              data-testid="admin-orders-status-filter"
              className="bg-background border-border text-foreground sm:max-w-xs"
            >
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
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
                <TableHead className="text-muted-foreground">Numéro</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Client</TableHead>
                <TableHead className="text-muted-foreground">Total</TableHead>
                <TableHead className="text-muted-foreground">Paiement</TableHead>
                <TableHead className="text-muted-foreground">Statut paiement</TableHead>
                <TableHead className="text-muted-foreground">Statut commande</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!orders || orders.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Aucune commande trouvée
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const isInteracPending =
                    order.paymentMethod === "interac" && order.paymentStatus === "pending";
                  return (
                    <TableRow
                      key={order.id}
                      className="border-border"
                      data-testid={`admin-order-row-${order.id}`}
                    >
                      <TableCell className="font-medium text-foreground">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-foreground">
                        <div>{order.customerName}</div>
                        <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {order.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentStatusBadge(order.paymentStatus)}>
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={orderStatusBadge(order.orderStatus)}>
                          {order.orderStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-1">
                          {isInteracPending && (
                            <Button
                              size="sm"
                              data-testid={`admin-order-confirm-interac-${order.id}`}
                              disabled={actionMutation.isPending}
                              onClick={() => handleAction(order.id, "confirm-interac")}
                              className="bg-primary text-primary-foreground"
                            >
                              Confirmer Interac
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`admin-order-retry-pod-${order.id}`}
                            disabled={actionMutation.isPending}
                            onClick={() => handleAction(order.id, "retry-pod")}
                            className="border-border text-foreground"
                          >
                            Réessayer POD
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`admin-order-update-tracking-${order.id}`}
                            disabled={actionMutation.isPending}
                            onClick={() => handleAction(order.id, "update-tracking")}
                            className="border-border text-foreground"
                          >
                            Suivi
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            data-testid={`admin-order-cancel-${order.id}`}
                            disabled={
                              actionMutation.isPending || order.orderStatus === "cancelled"
                            }
                            onClick={() => handleAction(order.id, "cancel")}
                          >
                            Annuler
                          </Button>
                        </div>
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

export default AdminOrdersPage;
