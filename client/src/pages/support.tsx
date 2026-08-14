import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
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
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 md:py-16">
      <Link href="/">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2 uppercase tracking-wide text-xs">
          <ArrowLeft className="w-4 h-4 mr-1" />
          {useI18n().lang === "fr" ? "Boutique" : "Shop"}
        </Button>
      </Link>
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-red-600">{icon}</span>
          <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
            {title}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm md:text-base">{intro}</p>
      </header>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Contact                                                                    */
/* -------------------------------------------------------------------------- */

function getContactContent(lang: Lang) {
  if (lang === "en") return {
    title: "Contact Us",
    intro: "A question about an order, a defect to report, or a design idea? Write to us — we reply to every message.",
    emailLabel: "Email",
    responseTitle: "Response Time",
    responseDesc: "Within 1 to 2 business days, Monday to Friday (Eastern Time).",
    beforeTitle: "Before You Write",
    defectLabel: "Defect or damaged package:",
    defectDesc: " include a clear photo of the complete item and your order number. Without a photo, our printers cannot process the claim.",
    delayLabel: "Time limit:",
    delayDesc: " 30 days after delivery. After this period, our suppliers refuse all claims.",
    sizeLabel: "Size question:",
    sizeDesc: " check the size guide on the product page first — size exchanges are not possible on made-to-order items.",
    formTitle: "Form",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailFieldLabel: "Email",
    emailPlaceholder: "you@example.com",
    orderLabel: "Order number (optional)",
    subjectLabel: "Subject",
    subjects: ["General question", "Defective or damaged item", "Package not received", "Question about an order", "Payment or billing", "Collaboration or bulk"],
    messageLabel: "Message",
    messagePlaceholder: "Describe your request as precisely as possible.",
    sendBtn: "Open my email",
    sendNote: "The button prepares the message in your email app. You can attach your photos before sending.",
    sentMsg: "Your email app should open. If nothing happens, write directly to",
    mailtoFields: { name: "Name", email: "Email", order: "Order number" },
  };
  return {
    title: "Nous joindre",
    intro: "Une question sur une commande, un défaut à signaler ou une idée de design ? Écris-nous, on répond à chaque message.",
    emailLabel: "Courriel",
    responseTitle: "Délai de réponse",
    responseDesc: "Sous 1 à 2 jours ouvrables, du lundi au vendredi (heure de l'Est).",
    beforeTitle: "Avant de nous écrire",
    defectLabel: "Défaut ou colis endommagé :",
    defectDesc: " joins une photo nette de l'article complet et ton numéro de commande. Sans photo, nos imprimeurs ne peuvent pas traiter la réclamation.",
    delayLabel: "Délai à respecter :",
    delayDesc: " 30 jours suivant la livraison. Passé ce délai, nos fournisseurs refusent toute réclamation.",
    sizeLabel: "Question de taille :",
    sizeDesc: " consulte d'abord le guide des tailles sur la fiche produit — les échanges de taille ne sont pas possibles sur du fabriqué à la commande.",
    formTitle: "Formulaire",
    nameLabel: "Nom",
    namePlaceholder: "Ton nom",
    emailFieldLabel: "Courriel",
    emailPlaceholder: "toi@exemple.com",
    orderLabel: "Numéro de commande (optionnel)",
    subjectLabel: "Sujet",
    subjects: ["Question générale", "Défaut ou article endommagé", "Colis non reçu", "Question sur une commande", "Paiement ou facturation", "Collaboration ou gros volume"],
    messageLabel: "Message",
    messagePlaceholder: "Décris ta demande le plus précisément possible.",
    sendBtn: "Ouvrir mon courriel",
    sendNote: "Le bouton prépare le message dans ton application de courriel. Tu peux y joindre tes photos avant l'envoi.",
    sentMsg: "Ton logiciel de courriel devrait s'ouvrir. Si rien ne se passe, écris directement à",
    mailtoFields: { name: "Nom", email: "Courriel", order: "Numéro de commande" },
  };
}

export function ContactPage() {
  const { lang } = useI18n();
  const c = getContactContent(lang);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    orderNumber: "",
    subject: c.subjects[0],
    message: "",
  });

  const mailtoHref = () => {
    const body = [
      `${c.mailtoFields.name} : ${form.name}`,
      `${c.mailtoFields.email} : ${form.email}`,
      form.orderNumber ? `${c.mailtoFields.order} : ${form.orderNumber}` : "",
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
      title={c.title}
      intro={c.intro}
    >
      {/* Coordonnées */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="rounded-lg border border-border p-5">
          <Mail className="w-5 h-5 text-red-600 mb-3" />
          <h2 className="font-display font-bold uppercase tracking-wide text-sm mb-1">
            {c.emailLabel}
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
            {c.responseTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {c.responseDesc}
          </p>
        </div>
      </div>

      {/* Avant d'écrire */}
      <div className="rounded-lg border border-red-600/30 bg-red-600/5 p-5 mb-10">
        <h2 className="font-display font-bold uppercase tracking-wide text-sm mb-3 text-red-600">
          {c.beforeTitle}
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <span className="text-foreground font-medium">{c.defectLabel}</span>{" "}
            {c.defectDesc}
          </li>
          <li>
            <span className="text-foreground font-medium">{c.delayLabel}</span>{c.delayDesc}
          </li>
          <li>
            <span className="text-foreground font-medium">{c.sizeLabel}</span>{c.sizeDesc}
          </li>
        </ul>
      </div>

      {/* Formulaire */}
      <div className="rounded-lg border border-border p-6">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-5 text-red-600">
          {c.formTitle}
        </h2>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name">{c.nameLabel}</Label>
              <Input
                id="contact-name"
                data-testid="input-contact-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={c.namePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">{c.emailFieldLabel}</Label>
              <Input
                id="contact-email"
                data-testid="input-contact-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={c.emailPlaceholder}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contact-order">{c.orderLabel}</Label>
              <Input
                id="contact-order"
                data-testid="input-contact-order"
                value={form.orderNumber}
                onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                placeholder="RNC-XXXXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-subject">{c.subjectLabel}</Label>
              <select
                id="contact-subject"
                data-testid="select-contact-subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {c.subjects.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-message">{c.messageLabel}</Label>
            <Textarea
              id="contact-message"
              data-testid="input-contact-message"
              rows={6}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder={c.messagePlaceholder}
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
              {c.sendBtn}
            </Button>
          </a>

          <p className="text-xs text-muted-foreground text-center">
            {c.sendNote}
          </p>

          {sent && (
            <p
              className="text-sm text-red-600 text-center"
              data-testid="text-contact-confirmation"
            >
              {c.sentMsg}{" "}
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

function getFaqGroups(lang: Lang): FaqGroup[] {
  const en = lang === "en";
  return [
    {
      icon: <Package className="w-5 h-5" />,
      title: en ? "Orders & Production" : "Commandes et production",
      items: [
        {
          q: en ? "How are my clothes made?" : "Comment mes vêtements sont-ils fabriqués ?",
          a: en ? (
            <>
              Each item is printed on demand by our print-on-demand partners — <span className="text-foreground font-medium">Printify</span>,{" "}
              <span className="text-foreground font-medium">Printful</span> and{" "}
              <span className="text-foreground font-medium">Gelato</span>. Nothing is produced in advance: your shirt doesn't exist before you order it. This is how we avoid surplus and unsold stock.
            </>
          ) : (
            <>
              Chaque article est imprimé à la commande par nos partenaires d'impression à la demande — <span className="text-foreground font-medium">Printify</span>,{" "}
              <span className="text-foreground font-medium">Printful</span> et{" "}
              <span className="text-foreground font-medium">Gelato</span>. Rien n'est produit d'avance : ton chandail n'existe pas avant que tu le commandes. C'est ce qui nous permet d'éviter les surplus et les invendus.
            </>
          ),
        },
        {
          q: en ? "How long before I receive my order?" : "Combien de temps avant de recevoir ma commande ?",
          a: en ? (
            <>
              Allow <span className="text-foreground font-medium">2 to 7 business days</span> for production, then shipping time. In Canada, most orders arrive in{" "}
              <span className="text-foreground font-medium">7 to 14 business days</span> total. Orders with multiple items may arrive in separate packages if produced in different facilities — at no extra cost.
            </>
          ) : (
            <>
              Compte <span className="text-foreground font-medium">2 à 7 jours ouvrables</span> de production, puis le délai de livraison. Au Canada, la plupart des commandes arrivent en{" "}
              <span className="text-foreground font-medium">7 à 14 jours ouvrables</span> au total. Les commandes contenant plusieurs articles peuvent arriver en colis séparés si elles sont produites dans des ateliers différents — sans frais additionnels.
            </>
          ),
        },
        {
          q: en ? "Can I modify or cancel my order?" : "Puis-je modifier ou annuler ma commande ?",
          a: en ? (
            <>Only if production hasn't started. Email us as fast as possible with your order number. Once printing has begun, the item is unique and can no longer be cancelled.</>
          ) : (
            <>Seulement si la production n'a pas commencé. Écris-nous le plus vite possible avec ton numéro de commande. Une fois l'impression lancée, l'article est unique et ne peut plus être annulé.</>
          ),
        },
        {
          q: en ? "Where can I track my order?" : "Où puis-je suivre ma commande ?",
          a: en ? (
            <>A tracking number is sent by email upon shipment. You can also check your order status with your order number on the confirmation page.</>
          ) : (
            <>Un numéro de suivi t'est envoyé par courriel dès l'expédition. Tu peux aussi consulter l'état de ta commande avec ton numéro de commande sur la page de confirmation.</>
          ),
        },
      ],
    },
    {
      icon: <RotateCcw className="w-5 h-5" />,
      title: en ? "Returns & Defects" : "Retours et défauts",
      items: [
        {
          q: en ? "Can I return an item because the size doesn't fit?" : "Puis-je retourner un article parce que la taille ne fait pas ?",
          a: en ? (
            <>No. Our items are made specifically for you, so returns for wrong size, change of mind, or color preference are not accepted — this is the common rule at Printify, Printful, and Gelato, which provide no return address. Check the size guide before ordering: it gives actual measurements in inches, not just S/M/L.</>
          ) : (
            <>Non. Nos articles sont fabriqués spécifiquement pour toi, alors les retours pour mauvaise taille, changement d'avis ou préférence de couleur ne sont pas acceptés — c'est la règle commune à Printify, Printful et Gelato, qui ne fournissent aucune adresse de retour. Consulte le guide des tailles avant de commander : il donne les mesures réelles en pouces, pas juste S/M/L.</>
          ),
        },
        {
          q: en ? "My item is defective, damaged, or misprinted. What do I do?" : "Mon article est défectueux, endommagé ou mal imprimé. Que faire ?",
          a: en ? (
            <>We'll replace or refund it at our expense. Email us{" "}
            <span className="text-foreground font-medium">within 30 days of delivery</span> with your order number and a clear photo showing the complete item and the defect. This 30-day window is enforced by all three suppliers — after that, they refuse the claim and we can no longer help.</>
          ) : (
            <>On le remplace ou on le rembourse, à nos frais. Écris-nous{" "}
            <span className="text-foreground font-medium">dans les 30 jours suivant la livraison</span> avec ton numéro de commande et une photo nette montrant l'article complet et le défaut. Ce délai de 30 jours est celui appliqué par nos trois fournisseurs — passé cette date, ils refusent la réclamation et nous ne pouvons plus rien faire.</>
          ),
        },
        {
          q: en ? "Do I need to send the defective item back?" : "Dois-je renvoyer l'article défectueux ?",
          a: en ? (
            <>No. Our suppliers don't ask for the item back and have no return address: the photo is enough to validate the claim. You keep the item and receive the replacement.</>
          ) : (
            <>Non. Nos fournisseurs ne demandent pas le retour de l'article et n'ont pas d'adresse de retour : la photo suffit à valider la réclamation. Tu gardes l'article et tu reçois le remplacement.</>
          ),
        },
        {
          q: en ? "What is NOT considered a defect?" : "Qu'est-ce qui n'est pas considéré comme un défaut ?",
          a: en ? (
            <>A slight print placement offset is normal in direct-to-garment printing: Printify applies a{" "}
            <span className="text-foreground font-medium">0.5-inch tolerance</span> on positioning. Minor color variations between screen and fabric, as well as normal wear after washing, are also not covered.</>
          ) : (
            <>Un léger décalage de placement de l'impression est normal en impression directe sur textile : Printify applique une{" "}
            <span className="text-foreground font-medium">tolérance de 0,5 pouce</span> sur le positionnement. Les variations mineures de teinte entre l'écran et le tissu, ainsi que l'usure normale après lavage, ne sont pas non plus couvertes.</>
          ),
        },
        {
          q: en ? "My package was lost in transit." : "Mon colis est perdu en transit.",
          a: en ? (
            <>Report it within <span className="text-foreground font-medium">30 days of the estimated delivery date</span>. We'll open an investigation with the carrier and supplier, and either resend your order or refund you.</>
          ) : (
            <>Signale-le dans les <span className="text-foreground font-medium">30 jours suivant la date de livraison estimée</span>. On ouvre une enquête avec le transporteur et le fournisseur, et on te renvoie la commande ou on te rembourse.</>
          ),
        },
        {
          q: en ? "What if the package is returned because the address was incomplete?" : "Et si le colis me revient parce que l'adresse était incomplète ?",
          a: en ? (
            <>An incorrect or incomplete address provided at checkout is not covered by the suppliers' guarantee. Email us: we can reship, but reshipping fees are at your expense.</>
          ) : (
            <>Une adresse erronée ou incomplète fournie à la commande n'est pas couverte par la garantie des fournisseurs. Écris-nous : on peut réexpédier, mais les frais de réexpédition sont à ta charge.</>
          ),
        },
        {
          q: en ? "How long for a refund?" : "Combien de temps pour être remboursé ?",
          a: en ? (
            <>Once the claim is validated by the supplier, the refund is issued to your original payment method. Allow{" "}
            <span className="text-foreground font-medium">5 to 10 business days</span> for it to appear on your statement, depending on your financial institution.</>
          ) : (
            <>Une fois la réclamation validée par le fournisseur, le remboursement est émis sur ton mode de paiement d'origine. Compte{" "}
            <span className="text-foreground font-medium">5 à 10 jours ouvrables</span> avant que ça apparaisse sur ton relevé, selon ton institution financière.</>
          ),
        },
      ],
    },
    {
      icon: <Truck className="w-5 h-5" />,
      title: en ? "Shipping" : "Livraison",
      items: [
        {
          q: en ? "What are the shipping fees?" : "Quels sont les frais de livraison ?",
          a: en ? (
            <><span className="text-foreground font-medium">$17.99</span> anywhere in Canada, and{" "}
            <span className="text-foreground font-medium">free shipping</span> on orders over $75 before taxes.</>
          ) : (
            <><span className="text-foreground font-medium">17,99 $</span> partout au Canada, et{" "}
            <span className="text-foreground font-medium">livraison gratuite</span> à partir de 75 $ d'achat avant taxes.</>
          ),
        },
        {
          q: en ? "Do you ship outside Canada?" : "Livrez-vous à l'extérieur du Canada ?",
          a: en ? (
            <>Our partner facilities are located across North America and Europe, enabling international shipping. Any customs duties and import taxes are the recipient's responsibility.</>
          ) : (
            <>Nos ateliers partenaires sont répartis en Amérique du Nord et en Europe, ce qui permet d'expédier à l'international. Les droits de douane et taxes d'importation éventuels sont à la charge du destinataire.</>
          ),
        },
      ],
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      title: en ? "Payment" : "Paiement",
      items: [
        {
          q: en ? "What payment methods do you accept?" : "Quels modes de paiement acceptez-vous ?",
          a: en ? (
            <>Credit and debit cards via <span className="text-foreground font-medium">Stripe</span>{" "}
            (encrypted payment, we never see your card number), as well as{" "}
            <span className="text-foreground font-medium">Interac e-Transfer</span>.</>
          ) : (
            <>Cartes de crédit et de débit via <span className="text-foreground font-medium">Stripe</span>{" "}
            (paiement chiffré, nous ne voyons jamais ton numéro de carte), ainsi que le{" "}
            <span className="text-foreground font-medium">virement Interac</span>.</>
          ),
        },
        {
          q: en ? "Do prices include taxes?" : "Les prix incluent-ils les taxes ?",
          a: en ? (
            <>Displayed prices are before taxes. GST and QST are calculated automatically at checkout based on your province.</>
          ) : (
            <>Les prix affichés sont avant taxes. La TPS et la TVQ sont calculées automatiquement à l'étape du paiement selon ta province.</>
          ),
        },
      ],
    },
    {
      icon: <Ruler className="w-5 h-5" />,
      title: en ? "Sizes & Care" : "Tailles et entretien",
      items: [
        {
          q: en ? "How do I choose my size?" : "Comment choisir ma taille ?",
          a: en ? (
            <>Each product page includes a size guide with the garment's actual measurements. Measure a shirt you already own and compare — that's the most reliable method, especially since no size exchanges are possible.</>
          ) : (
            <>Chaque fiche produit contient un guide des tailles avec les mesures réelles du vêtement. Mesure un chandail que tu portes déjà et compare — c'est la méthode la plus fiable, surtout qu'aucun échange de taille n'est possible.</>
          ),
        },
        {
          q: en ? "How do I wash my clothes so the print lasts?" : "Comment laver mes vêtements pour que l'impression dure ?",
          a: en ? (
            <>Cold water wash, inside out, no bleach. Low heat drying. Avoid ironing directly on the print.</>
          ) : (
            <>Lavage à l'eau froide, à l'envers, sans javellisant. Séchage à basse température. Évite de repasser directement sur l'impression.</>
          ),
        },
      ],
    },
    {
      icon: <Leaf className="w-5 h-5" />,
      title: en ? "Our Approach" : "Notre démarche",
      items: [
        {
          q: en ? "Why print on demand?" : "Pourquoi l'impression à la demande ?",
          a: en ? (
            <>Because we don't want to produce mountains of clothes that end up in landfills. Nothing is printed before it's sold: zero surplus, zero unsold stock destroyed.</>
          ) : (
            <>Parce qu'on ne veut pas produire des montagnes de vêtements qui finiront à l'enfouissement. Rien n'est imprimé avant d'être vendu : zéro surplus, zéro invendu détruit.</>
          ),
        },
        {
          q: en ? "What do your designs represent?" : "Que représentent vos designs ?",
          a: en ? (
            <>Resist N Co creates clothing with engaged messages: antifascism, climate justice, solidarity, and critical thinking. Every design is original and created in-house.</>
          ) : (
            <>Resist N Co crée des vêtements aux messages engagés : antifascisme, justice climatique, solidarité et esprit critique. Chaque design est original et conçu à l'interne.</>
          ),
        },
      ],
    },
  ];
}

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
  const { lang } = useI18n();
  const groups = getFaqGroups(lang);
  const en = lang === "en";
  return (
    <SupportLayout
      icon={<HelpCircle className="w-6 h-6" />}
      title={en ? "Frequently Asked Questions" : "Foire aux questions"}
      intro={en
        ? "Production, shipping, returns, sizes, payment — answers to the questions we get most often."
        : "Production, livraison, retours, tailles, paiement — les réponses aux questions qu'on reçoit le plus souvent."}
    >
      <div className="space-y-10">
        {groups.map((group) => (
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
          {en ? "Your question isn't here?" : "Ta question n'est pas là ?"}
        </p>
        <Link href="/contact">
          <Button variant="outline" className="uppercase tracking-wide font-semibold">
            {en ? "Write to us" : "Nous écrire"}
          </Button>
        </Link>
      </div>
    </SupportLayout>
  );
}
