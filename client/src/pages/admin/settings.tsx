import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminSettings {
  site_name?: string;
  site_email?: string;
  interac_email?: string;
  interac_instructions?: string;
  shipping_flat_rate?: string;
  shipping_free_threshold?: string;
  [key: string]: string | undefined;
}

const FIELDS: {
  key: keyof AdminSettings;
  label: string;
  type: "text" | "number" | "textarea";
  placeholder?: string;
}[] = [
  { key: "site_name", label: "Nom du site", type: "text", placeholder: "Resist N Co" },
  { key: "site_email", label: "Courriel du site", type: "text", placeholder: "info@resistnco.ca" },
  {
    key: "interac_email",
    label: "Courriel Interac",
    type: "text",
    placeholder: "transfert@resistnco.ca",
  },
  {
    key: "interac_instructions",
    label: "Instructions Interac",
    type: "textarea",
    placeholder: "Instructions pour le transfert Interac...",
  },
  {
    key: "shipping_flat_rate",
    label: "Frais de livraison forfaitaires (CAD)",
    type: "number",
    placeholder: "17.99",
  },
  {
    key: "shipping_free_threshold",
    label: "Seuil livraison gratuite (CAD)",
    type: "number",
    placeholder: "75",
  },
];

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<AdminSettings>({});

  const { data, isLoading } = useQuery<AdminSettings>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (data) {
      const picked: AdminSettings = {};
      FIELDS.forEach((f) => {
        picked[f.key] = data[f.key] ?? "";
      });
      setForm(picked);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: AdminSettings) => {
      const res = await apiRequest("PATCH", "/api/admin/settings", payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Paramètres enregistrés" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (err: any) => {
      toast({
        title: "Erreur",
        description: err?.message || "L'enregistrement a échoué",
        variant: "destructive",
      });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate(form);
  }

  function updateField(key: keyof AdminSettings, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Paramètres</h1>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1
        className="font-display text-2xl font-bold uppercase tracking-wide"
        data-testid="admin-settings-title"
      >
        Paramètres
      </h1>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Configuration du site</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
            {FIELDS.map((field) => (
              <div key={String(field.key)} className="space-y-2">
                <Label htmlFor={String(field.key)} className="text-foreground">
                  {field.label}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={String(field.key)}
                    data-testid={`admin-setting-${field.key}`}
                    placeholder={field.placeholder}
                    value={(form[field.key] as string) ?? ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    rows={4}
                    className="bg-background border-border text-foreground"
                  />
                ) : (
                  <Input
                    id={String(field.key)}
                    type={field.type}
                    step={field.type === "number" ? "0.01" : undefined}
                    data-testid={`admin-setting-${field.key}`}
                    placeholder={field.placeholder}
                    value={(form[field.key] as string) ?? ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="bg-background border-border text-foreground"
                  />
                )}
              </div>
            ))}

            <Button
              type="submit"
              data-testid="admin-settings-save"
              disabled={saveMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSettingsPage;
