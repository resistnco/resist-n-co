import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { CartProvider } from "@/lib/cart";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Navbar, Footer } from "@/components/layout";
import { HomePage } from "@/pages/home";
import { ProductPage } from "@/pages/product";
import { DesignerPage } from "@/pages/designer";
import { CartPage } from "@/pages/cart";
import { CheckoutPage } from "@/pages/checkout";
import { PaymentSuccessPage } from "@/pages/payment-success";
import { PaymentFailurePage } from "@/pages/payment-failure";
import { PrivacyPage, TermsPage, ShippingPage, ReturnsPage } from "@/pages/legal";
import { AdminLoginPage } from "@/pages/admin/login";
import { AdminLayout } from "@/pages/admin/layout";
import { AdminDashboardPage } from "@/pages/admin/dashboard";
import { AdminOrdersPage } from "@/pages/admin/orders";
import { AdminProductsPage } from "@/pages/admin/products";
import { AdminSuppliersPage } from "@/pages/admin/suppliers";
import { AdminSettingsPage } from "@/pages/admin/settings";
import NotFound from "@/pages/not-found";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AppRouter() {
  const [location] = useLocation();

  // Admin routes — no storefront navbar/footer
  if (location.startsWith("/admin")) {
    return (
      <Switch>
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/admin/dashboard">
          <AdminLayout>
            <AdminDashboardPage />
          </AdminLayout>
        </Route>
        <Route path="/admin/commandes">
          <AdminLayout>
            <AdminOrdersPage />
          </AdminLayout>
        </Route>
        <Route path="/admin/produits">
          <AdminLayout>
            <AdminProductsPage />
          </AdminLayout>
        </Route>
        <Route path="/admin/fournisseurs">
          <AdminLayout>
            <AdminSuppliersPage />
          </AdminLayout>
        </Route>
        <Route path="/admin/parametres">
          <AdminLayout>
            <AdminSettingsPage />
          </AdminLayout>
        </Route>
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Storefront routes
  return (
    <AppLayout>
      <Switch>
        <Route path="/produit/:slug" component={ProductPage} />
        <Route path="/designer" component={DesignerPage} />
        <Route path="/panier" component={CartPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/paiement/succes" component={PaymentSuccessPage} />
        <Route path="/paiement/echec" component={PaymentFailurePage} />
        <Route path="/confidentialite" component={PrivacyPage} />
        <Route path="/conditions" component={TermsPage} />
        <Route path="/expedition" component={ShippingPage} />
        <Route path="/retours" component={ReturnsPage} />
        <Route path="/" component={HomePage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Router hook={useHashLocation}>
                <AppRouter />
              </Router>
            </TooltipProvider>
          </CartProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
