import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  HelpCircle,
  Clock,
  Package,
  RotateCcw,
  Truck,
  CreditCard,
  Ruler,
  Leaf,
  ChevronDown,
} from "lucide-react";

const SUPPORT_EMAIL = "support@resistnco.ca";

/* -------------------------------------------------------------------------- */
/* Shared layout                                                              */
/* -------------------------------------------------------------------------- */

function SupportLayout({
  icon,
  title,
  intro,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la boutique
        </Link>

        <header className="mb-10">
          <div className="w-12 h-12 rounded-lg bg-red-600/10 flex items-center justify-center mb-5">
            <span className="text-red-600">{icon}</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight mb-3">
            {title}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            {intro}
          </p>
        </header>

        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Contact                                                                    */
/* -------------------------------------------------------------------------- */

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    orderNumber: "",
    subject: "Question générale",
    message: "",
  });

  const mailtoHref = () => {
    const body = [
      `Nom : ${form.name}`,
      `Courriel : ${form.email}`,
      form.orderNumber ? `Numéro de commande : ${form.orderNumber}` : "",
      "",
      form.message,
    ]
      .filter(Boolean)
      .join("\n");
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      `[${form.subject}] Resist N Co`
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <SupportLayout
      icon={<MessageCircle className="w-6 h-6" />}
      title="Nous joindre"
      intro="Une question sur une commande, un défaut à signaler ou une idée de design ? Écris-nous, on répond à chaque message."
    >
      {/* Coordonnées */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="rounded-lg border border-border p-5">
          <Mail className="w-5 h-5 text-red-600 mb-3" />
          <h2 className="font-display font-bold uppercase tracking-wide text-sm mb-1">
            Courriel
          </h2>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-sm text-muted-foreground hover:text-red-600 break-all"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>
        <div className="rounded-lg border border-border p-5">
          <Clock className="w-5 h-5 text-red-600 mb-3" />
          <h2 className="font-display font-bold uppercase tracking-wide text-sm mb-1">
            Délai de réponse
          </h2>
          <p className="text-sm text-muted-foreground">
            Sous 1 à 2 jours ouvrables, du lundi au vendredi (heure de l'Est).
          </p>
        </div>
      </div>

      {/* Avant d'écrire */}
      <div className="rounded-lg border border-red-600/30 bg-red-600/5 p-5 mb-10">
        <h2 className="font-display font-bold uppercase tracking-wide text-sm mb-3 text-red-600">
          Avant de nous écrire
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="text-foreground font-medium">Défaut ou colis endommagé :</span>{" "}
            joins une photo nette de l'article complet et ton numéro de commande. Sans photo,
            nos imprimeurs ne peuvent pas traiter la réclamation.
          </li>
          <li>
            <span className="text-foreground font-medium">Délai à respecter :</span> 30 jours
            suivant la livraison. Passé ce délai, nos fournisseurs refusent toute réclamation.
          </li>
          <li>
            <span className="text-foreground font-medium">Question de taille :</span> consulte
            d'abord le guide des tailles sur la fiche produit — les échanges de taille ne sont
            pas possibles sur du fabriqué à la commande.
          </li>
        </ul>
      </div>

      {/* Formulaire */}
      <div className="rounded-lg border border-border p-6">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-5 text-red-600">
          Formulaire
        </h2>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name">Nom</Label>
              <Input
                id="contact-name"
                data-testid="input-contact-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ton nom"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">Courriel</Label>
              <Input
                id="contact-email"
                data-testid="input-contact-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="toi@exemple.com"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-order">Numéro de commande (optionnel)</Label>
              <Input
                id="contact-order"
                data-testid="input-contact-order"
                value={form.orderNumber}
                onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                placeholder="RNC-XXXXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-subject">Sujet</Label>
              <select
                id="contact-subject"
                data-testid="select-contact-subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option>Question générale</option>
                <option>Défaut ou article endommagé</option>
                <option>Colis non reçu</option>
                <option>Question sur une commande</option>
                <option>Paiement ou facturation</option>
                <option>Collaboration ou gros volume</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              data-testid="input-contact-message"
              rows={6}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Décris ta demande le plus précisément possible."
            />
          </div>

          <a
            href={mailtoHref()}
            onClick={() => setSent(true)}
            className="block"
          >
            <Button
              className="w-full uppercase tracking-wide font-semibold"
              data-testid="button-contact-send"
              disabled={!form.name || !form.email || !form.message}
            >
              Ouvrir mon courriel
            </Button>
          </a>

          <p className="text-xs text-muted-foreground text-center">
            Le bouton prépare le message dans ton application de courriel. Tu peux y joindre tes
            photos avant l'envoi.
          </p>

          {sent && (
            <p
              className="text-sm text-red-600 text-center"
              data-testid="text-contact-confirmation"
            >
              Ton logiciel de courriel devrait s'ouvrir. Si rien ne se passe, écris directement à{" "}
              {SUPPORT_EMAIL}.
            </p>
          )}
        </div>
      </div>
    </SupportLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* FAQ                                                                        */
/* -------------------------------------------------------------------------- */

type FaqItem = { q: string; a: React.ReactNode };
type FaqGroup = { icon: React.ReactNode; title: string; items: FaqItem[] };

const FAQ_GROUPS: FaqGroup[] = [
  {
    icon: <Package className="w-5 h-5" />,
    title: "Commandes et production",
    items: [
      {
        q: "Comment mes vêtements sont-ils fabriqués ?",
        a: (
          <>
            Chaque article est imprimé à la commande par nos partenaires d'impression à la
            demande — <span className="text-foreground font-medium">Printify</span>,{" "}
            <span className="text-foreground font-medium">Printful</span> et{" "}
            <span className="text-foreground font-medium">Gelato</span>. Rien n'est produit
            d'avance : ton chandail n'existe pas avant que tu le commandes. C'est ce qui nous
            permet d'éviter les surplus et les invendus.
          </>
        ),
      },
      {
        q: "Combien de temps avant de recevoir ma commande ?",
        a: (
          <>
            Compte <span className="text-foreground font-medium">2 à 7 jours ouvrables</span> de
            production, puis le délai de livraison. Au Canada, la plupart des commandes arrivent
            en <span className="text-foreground font-medium">7 à 14 jours ouvrables</span> au
            total. Les commandes contenant plusieurs articles peuvent arriver en colis séparés
            si elles sont produites dans des ateliers différents — sans frais additionnels.
          </>
        ),
      },
      {
        q: "Puis-je modifier ou annuler ma commande ?",
        a: (
          <>
            Seulement si la production n'a pas commencé. Écris-nous le plus vite possible avec
            ton numéro de commande. Une fois l'impression lancée, l'article est unique et ne
            peut plus être annulé.
          </>
        ),
      },
      {
        q: "Où puis-je suivre ma commande ?",
        a: (
          <>
            Un numéro de suivi t'est envoyé par courriel dès l'expédition. Tu peux aussi
            consulter l'état de ta commande avec ton numéro de commande sur la page de
            confirmation.
          </>
        ),
      },
    ],
  },
  {
    icon: <RotateCcw className="w-5 h-5" />,
    title: "Retours et défauts",
    items: [
      {
        q: "Puis-je retourner un article parce que la taille ne fait pas ?",
        a: (
          <>
            Non. Nos articles sont fabriqués spécifiquement pour toi, alors les retours pour
            mauvaise taille, changement d'avis ou préférence de couleur ne sont pas acceptés —
            c'est la règle commune à Printify, Printful et Gelato, qui ne fournissent aucune
            adresse de retour. Consulte le guide des tailles avant de commander : il donne les
            mesures réelles en pouces, pas juste S/M/L.
          </>
        ),
      },
      {
        q: "Mon article est défectueux, endommagé ou mal imprimé. Que faire ?",
        a: (
          <>
            On le remplace ou on le rembourse, à nos frais. Écris-nous{" "}
            <span className="text-foreground font-medium">dans les 30 jours suivant la
            livraison</span> avec ton numéro de commande et une photo nette montrant l'article
            complet et le défaut. Ce délai de 30 jours est celui appliqué par nos trois
            fournisseurs — passé cette date, ils refusent la réclamation et nous ne pouvons plus
            rien faire.
          </>
        ),
      },
      {
        q: "Dois-je renvoyer l'article défectueux ?",
        a: (
          <>
            Non. Nos fournisseurs ne demandent pas le retour de l'article et n'ont pas d'adresse
            de retour : la photo suffit à valider la réclamation. Tu gardes l'article et tu
            reçois le remplacement.
          </>
        ),
      },
      {
        q: "Qu'est-ce qui n'est pas considéré comme un défaut ?",
        a: (
          <>
            Un léger décalage de placement de l'impression est normal en impression directe sur
            textile : Printify applique une{" "}
            <span className="text-foreground font-medium">tolérance de 0,5 pouce</span> sur le
            positionnement. Les variations mineures de teinte entre l'écran et le tissu, ainsi
            que l'usure normale après lavage, ne sont pas non plus couvertes.
          </>
        ),
      },
      {
        q: "Mon colis est perdu en transit.",
        a: (
          <>
            Signale-le dans les <span className="text-foreground font-medium">30 jours suivant
            la date de livraison estimée</span>. On ouvre une enquête avec le transporteur et le
            fournisseur, et on te renvoie la commande ou on te rembourse.
          </>
        ),
      },
      {
        q: "Et si le colis me revient parce que l'adresse était incomplète ?",
        a: (
          <>
            Une adresse erronée ou incomplète fournie à la commande n'est pas couverte par la
            garantie des fournisseurs. Écris-nous : on peut réexpédier, mais les frais de
            réexpédition sont à ta charge.
          </>
        ),
      },
      {
        q: "Combien de temps pour être remboursé ?",
        a: (
          <>
            Une fois la réclamation validée par le fournisseur, le remboursement est émis sur ton
            mode de paiement d'origine. Compte{" "}
            <span className="text-foreground font-medium">5 à 10 jours ouvrables</span> avant
            que ça apparaisse sur ton relevé, selon ton institution financière.
          </>
        ),
      },
    ],
  },
  {
    icon: <Truck className="w-5 h-5" />,
    title: "Livraison",
    items: [
      {
        q: "Quels sont les frais de livraison ?",
        a: (
          <>
            <span className="text-foreground font-medium">9,99 $</span> partout au Canada, et{" "}
            <span className="text-foreground font-medium">livraison gratuite</span> à partir de
            75 $ d'achat avant taxes.
          </>
        ),
      },
      {
        q: "Livrez-vous à l'extérieur du Canada ?",
        a: (
          <>
            Nos ateliers partenaires sont répartis en Amérique du Nord et en Europe, ce qui
            permet d'expédier à l'international. Les droits de douane et taxes d'importation
            éventuels sont à la charge du destinataire.
          </>
        ),
      },
    ],
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Paiement",
    items: [
      {
        q: "Quels modes de paiement acceptez-vous ?",
        a: (
          <>
            Cartes de crédit et de débit via <span className="text-foreground font-medium">Stripe</span>{" "}
            (paiement chiffré, nous ne voyons jamais ton numéro de carte), ainsi que le{" "}
            <span className="text-foreground font-medium">virement Interac</span>.
          </>
        ),
      },
      {
        q: "Les prix incluent-ils les taxes ?",
        a: (
          <>
            Les prix affichés sont avant taxes. La TPS et la TVQ sont calculées automatiquement à
            l'étape du paiement selon ta province.
          </>
        ),
      },
    ],
  },
  {
    icon: <Ruler className="w-5 h-5" />,
    title: "Tailles et entretien",
    items: [
      {
        q: "Comment choisir ma taille ?",
        a: (
          <>
            Chaque fiche produit contient un guide des tailles avec les mesures réelles du
            vêtement. Mesure un chandail que tu portes déjà et compare — c'est la méthode la plus
            fiable, surtout qu'aucun échange de taille n'est possible.
          </>
        ),
      },
      {
        q: "Comment laver mes vêtements pour que l'impression dure ?",
        a: (
          <>
            Lavage à l'eau froide, à l'envers, sans javellisant. Séchage à basse température.
            Évite de repasser directement sur l'impression.
          </>
        ),
      },
    ],
  },
  {
    icon: <Leaf className="w-5 h-5" />,
    title: "Notre démarche",
    items: [
      {
        q: "Pourquoi l'impression à la demande ?",
        a: (
          <>
            Parce qu'on ne veut pas produire des montagnes de vêtements qui finiront à
            l'enfouissement. Rien n'est imprimé avant d'être vendu : zéro surplus, zéro invendu
            détruit.
          </>
        ),
      },
      {
        q: "Que représentent vos designs ?",
        a: (
          <>
            Resist N Co crée des vêtements aux messages engagés : antifascisme, justice
            climatique, solidarité et esprit critique. Chaque design est original et conçu à
            l'interne.
          </>
        ),
      },
    ],
  },
];

function FaqEntry({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        data-testid={`button-faq-${item.q.slice(0, 20)}`}
        className="w-full flex items-start justify-between gap-4 py-4 text-left group"
      >
        <span className="font-medium text-sm md:text-base text-foreground group-hover:text-red-600 transition-colors">
          {item.q}
        </span>
        <ChevronDown
          className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180 text-red-600" : ""
          }`}
        />
      </button>
      {open && (
        <div className="pb-5 text-sm md:text-base text-muted-foreground leading-relaxed">
          {item.a}
        </div>
      )}
    </div>
  );
}

export function FaqPage() {
  return (
    <SupportLayout
      icon={<HelpCircle className="w-6 h-6" />}
      title="Foire aux questions"
      intro="Production, livraison, retours, tailles, paiement — les réponses aux questions qu'on reçoit le plus souvent."
    >
      <div className="space-y-10">
        {FAQ_GROUPS.map((group) => (
          <section key={group.title}>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-red-600">{group.icon}</span>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide">
                {group.title}
              </h2>
            </div>
            <div>
              {group.items.map((item) => (
                <FaqEntry key={item.q} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-border text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Ta question n'est pas là ?
        </p>
        <Link href="/contact">
          <Button variant="outline" className="uppercase tracking-wide font-semibold">
            Nous écrire
          </Button>
        </Link>
      </div>
    </SupportLayout>
  );
}
