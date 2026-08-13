import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface AdminUser {
  id: number;
  email: string;
  role: string;
}

const NAV_LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/fournisseurs", label: "Fournisseurs" },
  { href: "/admin/parametres", label: "Paramètres" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/me");
        const data = await res.json();
        if (!active) return;
        if (data?.user) {
          setUser(data.user);
        } else {
          navigate("/admin/login");
        }
      } catch {
        if (active) navigate("/admin/login");
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogout() {
    try {
      await apiRequest("POST", "/api/admin/logout");
      await queryClient.invalidateQueries();
      toast({ title: "Déconnexion réussie" });
      navigate("/admin/login");
    } catch {
      navigate("/admin/login");
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Vérification de l'authentification...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="font-display text-xl font-bold uppercase tracking-wide text-sidebar-foreground">
            Resist <span className="text-primary">N Co</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Administration</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = location === link.href || location.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors uppercase tracking-wide ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                data-testid={`admin-nav-${link.href.split("/").pop()}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          {user && (
            <div className="text-xs text-muted-foreground truncate">
              {user.email}
              <span className="block text-[10px] uppercase">{user.role}</span>
            </div>
          )}
          <Button
            variant="outline"
            data-testid="admin-nav-logout"
            onClick={handleLogout}
            className="w-full border-border text-foreground hover:bg-sidebar-accent"
          >
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

export default AdminLayout;
