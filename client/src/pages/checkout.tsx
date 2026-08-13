import { useState } from "react";
import { Link } from "wouter";
import { useCart } from "@/lib/cart";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const PROVINCES = [
  "Québec", "Ontario", "Colombie-Britannique", "Alberta", "Manitoba", "Saskatchewan",
  "Nouvelle-Écosse", "Nouveau-Brunswick", "Terre-Neuve-et-Labrador", "Île-du-Prince-Édouard",
  "Yukon", "Territoires du Nord-Ouest", "Nunavut",
];

const PROVINCE_CODES: Record<string, string> = {
  "Québec": "QC", "Ontario": "ON", "Colombie-Britannique": "BC", "Alberta": "AB",
  "Manitoba": "MB", "Saskatchewan": "SK", "Nouvelle-Écosse": "NS", "Nouveau-Brunswick": "NB",
  "Terre-Neuve-et-Labrador": "NL", "Île-du-Prince-Édouard": "PE", "Yukon": "YT",
  "Territoires du Nord-Ouest": "NT", "Nunavut": "NU",
};

export function CheckoutPage() {
  const { items, subtotal, visitorId } = useCart();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "interac">("stripe");
  const [processing, setProcessing] = useState(false);
  const [interacResult, setInteracResult] = useState<{ orderNumber: string; total: number; interacEmail: string } | null>(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", city: "", province: "Québec", postalCode: "",
  });

  const shipping = subtotal >= 75 ? 0 : 9.99;
  const provinceCode = PROVINCE_CODES[form.province] || "QC";
  const taxRate = provinceCode === "QC" ? 0.14975 : 0.05;
  const taxes = subtotal * taxRate;
  const total = subtotal + shipping + taxes;

  const handleCheckout = async () => {
    if (!form.name || !form.email || !form.address || !form.city || !form.postalCode) {
      toast({ title: "Veuillez remplir tous les champs requis", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Votre panier est vide", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      const cartItems = items.map(i => ({
        productId: i.productId,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
      }));

      if (paymentMethod === "stripe") {
        const res = await apiRequest("POST", "/api/checkout/stripe", {
          items: cartItems,
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          shippingAddress: form.address,
          city: form.city,
          province: provinceCode,
          postalCode: form.postalCode,
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast({ title: data.error || "Erreur Stripe", variant: "destructive" });
        }
      } else {
        const res = await apiRequest("POST", "/api/checkout/interac", {
          items: cartItems,
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          shippingAddress: form.address,
          city: form.city,
          province: provinceCode,
          postalCode: form.postalCode,
        });
        const data = await res.json();
        if (data.orderNumber) {
          setInteracResult({ orderNumber: data.orderNumber, total: data.total, interacEmail: data.interacEmail });
        } else {
          toast({ title: data.error || "Erreur", variant: "destructive" });
        }
      }
    } catch (e: any) {
      toast({ title: e.message || "Erreur lors de la commande", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (interacResult) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4M12 16h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold mb-2">Commande créée — Paiement Interac en attente</h1>
        <p className="text-sm text-muted-foreground mb-2">Votre numéro de commande</p>
        <Badge variant="secondary" className="text-lg mb-6">{interacResult.orderNumber}</Badge>
        <div className="text-left p-4 bg-muted/50 rounded-lg max-w-md mx-auto">
          <p className="font-semibold mb-2">Instructions virement Interac:</p>
          <p className="mb-2">Total à payer: <span className="font-bold text-foreground">{interacResult.total.toFixed(2)} $ CAD</span></p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Connectez-vous à votre application bancaire en ligne</li>
            <li>Sélectionnez Virement Interac</li>
            <li>Envoyez le montant de <strong>{interacResult.total.toFixed(2)} $</strong> à: <strong>{interacResult.interacEmail}</strong></li>
            <li>Utilisez le numéro de commande <strong>{interacResult.orderNumber}</strong> comme référence</li>
            <li>Votre commande sera traitée dès réception du paiement</li>
          </ol>
        </div>
        <p className="text-xs text-muted-foreground mt-4">Un courriel avec ces instructions vous a été envoyé.</p>
        <div className="flex justify-center gap-3 mt-6">
          <Link href="/"><Button>Retour à la boutique</Button></Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
        <h1 className="text-xl font-semibold mb-2">Votre panier est vide</h1>
        <Link href="/"><Button>Parcourir la boutique</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <h1 className="font-display text-xl md:text-2xl font-bold mb-6">Commande</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5" data-testid="card-shipping-info">
            <h2 className="font-semibold text-sm mb-4">Informations de livraison</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nom complet *</Label>
                <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} data-testid="input-name" />
              </div>
              <div>
                <Label htmlFor="email">Courriel *</Label>
                <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} data-testid="input-email" />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} data-testid="input-phone" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Adresse *</Label>
                <Input id="address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} data-testid="input-address" />
              </div>
              <div>
                <Label htmlFor="city">Ville *</Label>
                <Input id="city" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} data-testid="input-city" />
              </div>
              <div>
                <Label htmlFor="province">Province *</Label>
                <select id="province" className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} data-testid="select-province">
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="postalCode">Code postal *</Label>
                <Input id="postalCode" value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} data-testid="input-postal-code" />
              </div>
            </div>
          </Card>

          <Card className="p-5" data-testid="card-payment-method">
            <h2 className="font-semibold text-sm mb-4">Méthode de paiement</h2>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${paymentMethod === "stripe" ? "border-red-600 bg-red-600/5" : "border-border"}`}>
                <input type="radio" name="payment" checked={paymentMethod === "stripe"} onChange={() => setPaymentMethod("stripe")} className="accent-red-600" data-testid="radio-stripe" />
                <div>
                  <span className="text-sm font-medium">Carte de crédit (Stripe)</span>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex — paiement sécurisé</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${paymentMethod === "interac" ? "border-red-600 bg-red-600/5" : "border-border"}`}>
                <input type="radio" name="payment" checked={paymentMethod === "interac"} onChange={() => setPaymentMethod("interac")} className="accent-red-600" data-testid="radio-interac" />
                <div>
                  <span className="text-sm font-medium">Virement Interac</span>
                  <p className="text-xs text-muted-foreground">Paiement par virement bancaire — confirmation manuelle</p>
                </div>
              </label>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-5 sticky top-4" data-testid="card-order-summary">
            <h2 className="font-semibold text-sm mb-4">Résumé de la commande</h2>
            <div className="space-y-2 text-sm">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{item.productName} ({item.size}, {item.color}) × {item.quantity}</span>
                  <span>{(item.price * item.quantity).toFixed(2)} $</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{subtotal.toFixed(2)} $</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>{shipping === 0 ? "Gratuite" : `${shipping.toFixed(2)} $`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxes (TPS{provinceCode === "QC" ? " + TVQ" : ""})</span>
                  <span>{taxes.toFixed(2)} $</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span>{total.toFixed(2)} $ CAD</span>
                </div>
              </div>
            </div>
            <Button
              className="w-full mt-4 bg-red-600 hover:bg-red-700"
              disabled={processing}
              onClick={handleCheckout}
              data-testid="button-checkout"
            >
              {processing ? "Traitement..." : paymentMethod === "stripe" ? "Payer par carte" : "Commander (Interac)"}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Paiement sécurisé · Livraison gratuite dès 75 $
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
