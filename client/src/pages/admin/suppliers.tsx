import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface PodProvider {
  name: string;
  configured: boolean;
}

interface PodStatus {
  providers: PodProvider[];
  stripe: boolean;
  email: boolean;
}

function StatusBadge({ configured }: { configured: boolean }) {
  return configured ? (
    <Badge data-testid={`status-configured`} className="bg-primary text-primary-foreground">
      Configuré
    </Badge>
  ) : (
    <Badge variant="destructive" data-testid={`status-not-configured`}>
      Non configuré
    </Badge>
  );
}

export function AdminSuppliersPage() {
  const { data, isLoading } = useQuery<PodStatus>({
    queryKey: ["/api/admin/pod/status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/pod/status");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <h1
        className="font-display text-2xl font-bold uppercase tracking-wide"
        data-testid="admin-suppliers-title"
      >
        Fournisseurs
      </h1>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          {/* POD providers */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.providers.map((provider) => (
              <Card
                key={provider.name}
                className="border-border bg-card"
                data-testid={`admin-supplier-card-${provider.name.toLowerCase()}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-foreground">{provider.name}</CardTitle>
                  <StatusBadge configured={provider.configured} />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Fournisseur d'impression à la demande (POD)
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Integrations */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border bg-card" data-testid="admin-integration-stripe">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-foreground">Stripe</CardTitle>
                <StatusBadge configured={!!data?.stripe} />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Paiement par carte bancaire</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card" data-testid="admin-integration-email">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-foreground">Courriel</CardTitle>
                <StatusBadge configured={!!data?.email} />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Notifications et confirmations par courriel
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminSuppliersPage;
