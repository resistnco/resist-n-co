import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, RotateCcw, Mail, Phone } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function PaymentFailurePage() {
  const { t } = useI18n();
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const orderNumber = params.get("order") || "";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center mb-5">
            <XCircle className="w-9 h-9 text-red-600" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight mb-3">
            {t("payFail.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("payFail.desc")}
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Order number banner */}
            {orderNumber && (
              <div className="bg-red-600/5 border-b border-border px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Numéro de commande
                  </p>
                  <p className="font-display font-bold text-lg text-red-600 break-all">
                    {orderNumber}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600/60" />
              </div>
            )}

            <div className="px-6 py-6 space-y-5">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Votre commande a été enregistrée, mais le paiement n'a pas abouti. Vous
                  pouvez réessayer le paiement à tout moment à l'aide du bouton ci-dessous.
                </p>
                <p>
                  Vérifiez que les informations de votre carte sont correctes, que les fonds
                  sont suffisants et que votre banque n'a pas bloqué la transaction. Les
                  méthodes acceptées incluent Visa, Mastercard et Amex via Stripe, ainsi que
                  Interac e-Transfer.
                </p>
              </div>

              {/* Reasons checklist */}
              <div className="bg-muted/40 rounded-lg px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Causes fréquentes
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>• Carte expirée ou numéro invalide</li>
                  <li>• Fonds insuffisants</li>
                  <li>• Transaction refusée par votre banque</li>
                  <li>• Limite de dépense dépassée</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {orderNumber && (
            <Link href={`/checkout?order=${encodeURIComponent(orderNumber)}`} className="flex-1">
              <Button size="lg" className="w-full uppercase tracking-wide font-semibold">
                <RotateCcw className="w-4 h-4 mr-2" />
                {t("payFail.retry")}
              </Button>
            </Link>
          )}
          <Link href="/panier" className="flex-1">
            <Button
              size="lg"
              variant="outline"
              className="w-full uppercase tracking-wide font-semibold"
            >
              Retour au panier
            </Button>
          </Link>
        </div>

        {/* Contact info */}
        <div className="mt-8 border border-border rounded-lg px-6 py-5">
          <h2 className="font-semibold text-sm uppercase tracking-wide mb-3">
            {t("payFail.contact")}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Notre équipe est disponible pour vous aider à finaliser votre commande. Contactez-nous :
          </p>
          <div className="flex flex-col sm:flex-row gap-4 text-sm">
            <a
              href="mailto:support@resistnco.ca"
              className="flex items-center gap-2 text-red-600 hover:underline"
            >
              <Mail className="w-4 h-4" />
              support@resistnco.ca
            </a>
            <span className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              1-888-555-0199
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailurePage;
