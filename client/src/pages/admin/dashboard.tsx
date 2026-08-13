import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  sales: { today: number; week: number; month: number };
  orders: {
    today: number;
    week: number;
    month: number;
    pending: number;
    interacPending: number;
    paid: number;
    pod: number;
    shipped: number;
    problems: number;
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value);
}

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/admin/dashboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/dashboard");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Tableau de bord</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const stats = [
    {
      label: "Ventes du jour",
      value: formatCurrency(data.sales.today),
      testId: "stat-sales-today",
    },
    {
      label: "Ventes du mois",
      value: formatCurrency(data.sales.month),
      testId: "stat-sales-month",
    },
    {
      label: "Commandes en attente",
      value: String(data.orders.pending),
      testId: "stat-orders-pending",
    },
    {
      label: "Commandes Interac en attente",
      value: String(data.orders.interacPending),
      testId: "stat-orders-interac-pending",
    },
  ];

  const breakdown = [
    { label: "Commandes aujourd'hui", value: data.orders.today },
    { label: "Commandes cette semaine", value: data.orders.week },
    { label: "Commandes ce mois", value: data.orders.month },
    { label: "Payées", value: data.orders.paid },
    { label: "Envoyées au POD", value: data.orders.pod },
    { label: "Expédiées", value: data.orders.shipped },
    { label: "Problèmes (annulées/remboursées)", value: data.orders.problems },
  ];

  return (
    <div className="space-y-8">
      <h1
        className="font-display text-2xl font-bold uppercase tracking-wide"
        data-testid="admin-dashboard-title"
      >
        Tableau de bord
      </h1>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.testId} className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className="font-display text-2xl font-bold text-foreground"
                data-testid={stat.testId}
              >
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order status breakdown */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Répartition des commandes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {breakdown.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
              >
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <Badge variant="secondary" className="text-foreground">
                  {item.value}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminDashboardPage;
