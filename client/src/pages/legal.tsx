import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, Truck, RotateCcw, ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/* -------------------------------------------------------------------------- */
/* Shared layout helpers                                                       */
/* -------------------------------------------------------------------------- */

type LegalPageProps = {
  icon: React.ReactNode;
  title: string;
  intro: string;
  lastUpdated?: string;
  children: React.ReactNode;
};

function LegalLayout({ icon, title, intro, lastUpdated, children }: LegalPageProps) {
  const { t } = useI18n();
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 md:py-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("notfound.home")}
        </Link>

        {/* Header */}
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
          {lastUpdated && (
            <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4">
              {t("legal.lastUpdated")}: {lastUpdated}
            </p>
          )}
        </header>

        {/* Body */}
        <div className="space-y-8">{children}</div>

        {/* Footer CTA */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {t("legal.questions")}
          </p>
          <a href="mailto:support@resistnco.ca">
            <Button variant="outline" className="uppercase tracking-wide font-semibold">
              {t("payFail.contact")}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold uppercase tracking-wide mb-3 text-red-600">
        {title}
      </h2>
      <div className="space-y-3 text-sm md:text-base text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Politique de confidentialité — PrivacyPage                              */
/* -------------------------------------------------------------------------- */

export function PrivacyPage() {
  const { t } = useI18n();
  return (
    <LegalLayout
      icon={<ShieldCheck className="w-6 h-6" />}
      title={t("legal.privacyTitle")}
      intro="Resist N Co s'engage à protéger vos renseignements personnels. Cette politique décrit quelles données nous collectons, comment nous les utilisons et les droits dont vous disposez en vertu de la Loi sur la protection des renseignements personnels et les documents électroniques (LPRPDE)."
      lastUpdated="12 août 2026"
    >
      <Section title="1. Données que nous collectons">
        <p>
          Nous collectons les renseignements nécessaires au traitement de vos commandes et au
          bon fonctionnement de la boutique :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <span className="text-foreground font-medium">Informations de commande :</span>{" "}
            nom, adresse postale, ville, province, code postal, courriel et numéro de
            téléphone.
          </li>
          <li>
            <span className="text-foreground font-medium">Informations de paiement :</span>{" "}
          traitées directement par Stripe ou votre institution financière pour Interac
          e-Transfer. Nous ne stockons jamais les numéros de carte ou les données bancaires
          complètes.
          </li>
          <li>
            <span className="text-foreground font-medium">Données de navigation :</span>{" "}
          adresse IP, type de navigateur et pages visitées, recueillies via des témoins
          (cookies) et des outils d'analyse.
          </li>
          <li>
            <span className="text-foreground font-medium">Contenu de design :</span>{" "}
          les designs personnalisés créés dans notre outil de conception sont sauvegardés
          avec votre commande.
          </li>
        </ul>
      </Section>

      <Section title="2. Utilisation de vos renseignements">
        <p>Nous utilisons vos données aux fins suivantes :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Traitement, expédition et suivi de vos commandes.</li>
          <li>Communication relative au statut de votre commande et au service client.</li>
          <li>Transmission des informations nécessaires à nos fournisseurs d'impression à la demande (Printful, Printify, Gelato) pour la production de vos articles.</li>
          <li>Amélioration de notre site, de nos produits et de l'expérience d'achat.</li>
          <li>Respect des obligations légales et fiscales applicables.</li>
        </ul>
        <p>
          Nous ne vendons jamais vos renseignements personnels à des tiers. Le consentement
          peut être retiré à tout moment en nous contactant.
        </p>
      </Section>

      <Section title="3. Témoins (cookies)">
        <p>
          Notre site utilise des témoins pour mémoriser le contenu de votre panier, conserver
          vos préférences et mesurer le trafic de manière agrégée. Vous pouvez désactiver les
          témoins dans les paramètres de votre navigateur ; certaines fonctions du site
          pourraient alors être limitées.
        </p>
      </Section>

      <Section title="4. Partage avec des tiers">
        <p>
          Nous partageons uniquement les données nécessaires avec les prestataires suivants,
          dans la mesure requise pour fournir nos services :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="text-foreground font-medium">Stripe</span> — traitement sécurisé des paiements par carte.</li>
          <li><span className="text-foreground font-medium">Printful, Printify, Gelato</span> — production et expédition des articles en impression à la demande.</li>
          <li><span className="text-foreground font-medium">Transporteurs</span> (Canada Post, etc.) — suivi des colis.</li>
          <li><span className="text-foreground font-medium">Fournisseurs de courriel</span> — envoi des confirmations de commande.</li>
        </ul>
        <p>
          Chaque tiers est tenu de protéger vos renseignements conformément aux lois
          applicables. Nous ne partageons aucune donnée à des fins de marketing sans votre
          consentement explicite.
        </p>
      </Section>

      <Section title="5. Conservation et sécurité">
        <p>
          Nous conservons vos renseignements aussi longtemps que nécessaire pour fournir nos
          services et respecter nos obligations légales, fiscales et comptables. Les données
          sont stockées sur des serveurs sécurisés et l'accès est limité au personnel
          autorisé. Malgré nos efforts, aucune méthode de transmission sur Internet n'est
          totalement sécurisée.
        </p>
      </Section>

      <Section title="6. Vos droits en vertu de la LPRPDE">
        <p>
          En vertu de la Loi sur la protection des renseignements personnels et les documents
          électroniques (LPRPDE) et des lois provinciales applicables, vous disposez des droits
          suivants :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="text-foreground font-medium">Accès :</span> obtenir une copie des renseignements personnels que nous détenons à votre sujet.</li>
          <li><span className="text-foreground font-medium">Rectification :</span> corriger des renseignements inexacts ou incomplets.</li>
          <li><span className="text-foreground font-medium">Retrait du consentement :</span> retirer votre consentement à la collecte ou à l'utilisation de vos données.</li>
          <li><span className="text-foreground font-medium">Plainte :</span> déposer une plainte auprès du Commissariat à la protection de la vie privée du Canada (OPC) si vous estimez que vos droits ont été violés.</li>
        </ul>
        <p>
          Pour exercer ces droits, écrivez-nous à{" "}
          <a href="mailto:privacy@resistnco.ca" className="text-red-600 hover:underline">
            privacy@resistnco.ca
          </a>
          . Nous répondrons dans les 30 jours suivant la réception de votre demande.
        </p>
      </Section>

      <Section title="7. Modifications de cette politique">
        <p>
          Nous pouvons mettre à jour cette politique de temps à autre. La date de dernière
          mise à jour indiquée en haut de cette page sera révisée en conséquence. La version
          affichée prévaut en tout temps.
        </p>
      </Section>
    </LegalLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Conditions d'utilisation — TermsPage                                    */
/* -------------------------------------------------------------------------- */

export function TermsPage() {
  const { t } = useI18n();
  return (
    <LegalLayout
      icon={<FileText className="w-6 h-6" />}
      title={t("legal.termsTitle")}
      intro="Ces conditions régissent votre utilisation du site Resist N Co et de la boutique en ligne. En passant une commande ou en naviguant sur le site, vous acceptez les présentes conditions."
      lastUpdated="12 août 2026"
    >
      <Section title="1. Acceptation des conditions">
        <p>
          L'accès et l'utilisation du site resistnco.ca impliquent l'acceptation sans
          réserve des présentes conditions. Si vous n'acceptez pas ces conditions, veuillez
          cesser d'utiliser le site.
        </p>
      </Section>

      <Section title="2. Utilisation du site">
        <p>
          Vous vous engagez à utiliser le site de manière légale et à ne pas perturber son
          fonctionnement. Sont interdits : toute tentative d'accès non autorisé, la
          reproduction frauduleuse du contenu, l'envoi de contenu illicite ou diffamatoire, et
          l'utilisation de moyens automatisés pour extraire des données sans autorisation.
        </p>
        <p>
          Les designs créés via notre outil de conception ne doivent pas enfreindre les droits
          de propriété intellectuelle de tiers ni contenir de matériel haineux, discriminatoire
          ou illégal. Resist N Co se réserve le droit de refuser ou d'annuler toute commande
          dont le contenu contreviendrait à ces règles.
        </p>
      </Section>

      <Section title="3. Commandes">
        <p>
          Le fait de placer un article dans votre panier et de finaliser une commande constitue
          une offre d'achat. La commande est confirmée lorsque nous accusons réception du
          paiement et que le statut passe à « payée ». Nous nous réservons le droit de refuser
          ou d'annuler une commande en cas de prix erroné, de rupture de stock, de défaut de
          produit ou de soupçon d'activité frauduleuse. Dans un tel cas, le montant payé est
          intégralement remboursé.
        </p>
        <p>
          Les prix affichés sont en dollars canadiens (CAD) et peuvent être modifiés sans
          préavis. Les taxes applicables sont ajoutées au moment du paiement.
        </p>
      </Section>

      <Section title="4. Paiements">
        <p>
          Nous acceptons les paiements par carte de crédit (Visa, Mastercard, American Express)
          via Stripe et par Interac e-Transfer. Le paiement est traité au moment de la
          commande. Les transactions sont sécurisées par chiffrement SSL ; nous ne stockons pas
          vos informations de carte.
        </p>
        <p>
          En cas d'échec du paiement, votre commande est conservée et vous pouvez réessayer le
          paiement depuis la page de confirmation d'échec.
        </p>
      </Section>

      <Section title="5. Expédition">
        <p>
          Nos articles étant produits en impression à la demande, un délai de production de 2
          à 7 jours ouvrables s'applique avant l'expédition. Le délai d'expédition est ensuite
          de 3 à 10 jours ouvrables. La livraison est gratuite pour toute commande de 75 $ et
          plus ; un tarif forfaitaire de 17,99 $ s'applique en deçà de ce seuil. Consultez notre
          politique d'expédition complète pour les détails.
        </p>
      </Section>

      <Section title="6. Retours et remboursements">
        <p>
          Les articles en impression à la demande sont fabriqués à la commande et ne sont
          généralement pas retournables, sauf en cas de défaut de fabrication. Tout défaut
          doit être signalé dans les 14 jours suivant la réception. Voir notre politique de
          retour pour les modalités complètes.
        </p>
      </Section>

      <Section title="7. Propriété intellectuelle">
        <p>
          L'ensemble du contenu du site — textes, images, logos, designs, marques de commerce
          et éléments graphiques — est la propriété de Resist N Co ou de ses concédants et est
          protégé par les lois canadiennes et internationales sur la propriété intellectuelle.
        </p>
        <p>
          Vous conservez les droits sur les designs personnels que vous créez et téléversez.
          Toutefois, en soumettant un design, vous nous accordez une licence non exclusive,
          mondiale et sans redevance permettant de reproduire ce design uniquement aux fins de
          production de votre commande.
        </p>
      </Section>

      <Section title="8. Responsabilité">
        <p>
          Le site et les produits sont fournis « tels que disponibles ». Dans la mesure
          permise par la loi, Resist N Co décline toute responsabilité pour les dommages
          indirects, accessoires ou consécutifs résultant de l'utilisation du site ou des
          produits. Notre responsabilité totale pour toute réclamation ne saurait excéder le
          montant que vous avez payé pour la commande concernée.
        </p>
        <p>
          Nous ne sommes pas responsables des retards imputables aux transporteurs, aux
          fournisseurs d'impression à la demande ou à des événements indépendants de notre
          volonté.
        </p>
      </Section>

      <Section title="9. Modifications des conditions">
        <p>
          Nous pouvons modifier ces conditions à tout moment. Les conditions en vigueur sont
          celles affichées sur le site au moment de votre commande.
        </p>
      </Section>

      <Section title="10. Loi applicable">
        <p>
          Les présentes conditions sont régies par les lois du Canada et de la province de
          Québec. Tout litige est soumis aux tribunaux compétents de cette juridiction.
        </p>
      </Section>
    </LegalLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Politique d'expédition — ShippingPage                                    */
/* -------------------------------------------------------------------------- */

export function ShippingPage() {
  const { t } = useI18n();
  return (
    <LegalLayout
      icon={<Truck className="w-6 h-6" />}
      title={t("legal.shippingTitle")}
      intro="Nos articles sont fabriqués à la demande puis expédiés partout au Canada et à l'international. Voici à quoi vous attendre en matière de production, d'expédition et de frais."
      lastUpdated="12 août 2026"
    >
      <Section title="1. Délai de production (impression à la demande)">
        <p>
          Chaque article est imprimé et fabriqué spécifiquement pour vous après la confirmation
          de votre commande. Le délai de production est de <span className="text-foreground font-medium">2 à 7 jours ouvrables</span>, selon le produit, le fournisseur (Printful, Printify ou Gelato) et le volume de commandes en cours.
        </p>
        <p>
          Ce délai s'ajoute au délai d'expédition indiqué ci-dessous. Le délai total estimé est
          communiqué dans votre courriel de confirmation.
        </p>
      </Section>

      <Section title="2. Délais d'expédition">
        <p>
          Une fois la production terminée, l'expédition prend généralement{" "}
          <span className="text-foreground font-medium">3 à 10 jours ouvrables</span> selon votre
          emplacement au Canada et le mode de livraison choisi. Les commandes expédiées vers
          des régions éloignées peuvent nécessiter plus de temps.
        </p>
        <p>
          Un numéro de suivi vous est transmis par courriel dès que la commande est expédiée.
        </p>
      </Section>

      <Section title="3. Frais d'expédition">
        <div className="rounded-lg border border-border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-foreground font-medium">Commande de 75 $ et plus</span>
            <span className="text-red-600 font-semibold">Livraison gratuite</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="text-foreground font-medium">Commande de moins de 75 $</span>
            <span className="text-foreground font-semibold">17,99 $ (tarif forfaitaire)</span>
          </div>
        </div>
        <p>
          Le seuil de livraison gratuite est calculé sur le sous-total avant taxes. Les frais
          d'expédition sont affichés au moment du paiement avant la confirmation de la
          commande.
        </p>
      </Section>

      <Section title="4. Expédition internationale">
        <p>
          Nous expédions également à l'international par l'entremise de nos fournisseurs
          d'impression à la demande, qui disposent d'installations locales dans plus de 32
          pays. Les délais et frais varient selon la destination et sont calculés au moment du
          paiement.
        </p>
        <p>
          Les commandes internationales peuvent être assujetties à des droits de douane, taxes
          et frais de courtage à la livraison. Ces frais sont à la charge du destinataire et
          ne sont pas inclus dans le prix payé à Resist N Co.
        </p>
      </Section>

      <Section title="5. Suivi de commande">
        <p>
          Dès l'expédition, vous recevez un courriel contenant un numéro de suivi et un lien
          vers le site du transporteur. Vous pouvez aussi consulter le statut de votre
          commande à tout moment via le numéro de commande fourni lors de l'achat.
        </p>
      </Section>

      <Section title="6. Commandes perdues ou endommagées">
        <p>
          Si votre colis n'arrive pas dans les délais estimés ou s'il arrive endommagé,
          contactez-nous à{" "}
          <a href="mailto:support@resistnco.ca" className="text-red-600 hover:underline">
            support@resistnco.ca
          </a>{" "}
          dans les 14 jours suivant la date d'expédition prévue. Nous ouvrirons une enquête
          auprès du transporteur et organiserons un renvoi ou un remboursement selon le cas.
        </p>
      </Section>
    </LegalLayout>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Politique de retour — ReturnsPage                                        */
/* -------------------------------------------------------------------------- */

export function ReturnsPage() {
  const { t } = useI18n();
  return (
    <LegalLayout
      icon={<RotateCcw className="w-6 h-6" />}
      title={t("legal.returnsTitle")}
      intro="Nos articles sont fabriqués à la commande en impression à la demande. Cette politique explique les cas de retour, le signalement des défauts et le processus de remboursement."
      lastUpdated="12 août 2026"
    >
      <Section title="1. Articles fabriqués à la commande">
        <p>
          Chaque produit Resist N Co est imprimé et cousu spécifiquement pour vous après votre
          commande. Pour cette raison, les articles{" "}
          <span className="text-foreground font-medium">ne sont pas retournables ni
          échangeables</span> pour des raisons de taille, de couleur ou de changement d'avis.
        </p>
        <p>
          Nous vous invitons à consulter attentivement le guide des tailles et la description
          de chaque produit avant de finaliser votre commande.
        </p>
      </Section>

      <Section title="2. Défauts de fabrication">
        <p>
          Nous garantissons la qualité de nos produits. Si un article présente un défaut de
          fabrication — impression défectueuse, couture défaillante, mauvaise taille reçue par
          rapport à la commande, article endommagé à la livraison — nous le remplaçons ou le
          remboursons.
        </p>
        <p>
          Tout défaut doit être signalé dans un délai de{" "}
          <span className="text-foreground font-medium">30 jours suivant la livraison</span> de
          votre commande. Ce délai est celui appliqué par nos trois partenaires d'impression
          (Printify, Printful et Gelato) : passé cette date, ils refusent toute réclamation et
          nous ne pouvons plus obtenir de réimpression ni de remboursement.
        </p>
        <p>
          <span className="text-foreground font-medium">Vous n'avez pas à renvoyer l'article.</span>{" "}
          Nos fournisseurs ne fournissent pas d'adresse de retour pour les produits personnalisés :
          la photo du défaut suffit à valider la réclamation, et vous conservez l'article.
        </p>
      </Section>

      <Section title="2b. Ce qui n'est pas considéré comme un défaut">
        <p>
          Certaines variations sont inhérentes à l'impression à la demande et ne donnent pas
          droit à un remplacement :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Un léger décalage du positionnement de l'impression. Printify applique une{" "}
            <span className="text-foreground font-medium">tolérance de 0,5 pouce</span> sur le
            placement en impression directe sur textile (DTG).
          </li>
          <li>
            Une différence mineure de teinte entre l'aperçu à l'écran et le tissu imprimé.
          </li>
          <li>L'usure normale du vêtement ou de l'impression après lavage.</li>
          <li>
            Un problème causé par une adresse de livraison erronée ou incomplète fournie au
            moment de la commande.
          </li>
          <li>
            Un défaut provenant d'un fichier de design de faible résolution téléversé par le
            client via l'outil de création.
          </li>
        </ul>
      </Section>

      <Section title="2c. Colis perdu ou retourné à l'expéditeur">
        <p>
          Si le suivi indique que votre colis est perdu en transit, signalez-le dans les{" "}
          <span className="text-foreground font-medium">30 jours suivant la date de livraison
          estimée</span>. Nous ouvrons une enquête auprès du transporteur et du fournisseur, puis
          nous réexpédions la commande ou vous remboursons.
        </p>
        <p>
          Si le colis nous revient parce que l'adresse était incomplète ou erronée, la garantie
          des fournisseurs ne s'applique pas. Nous pouvons réexpédier, mais les frais de
          réexpédition sont à votre charge.
        </p>
      </Section>

      <Section title="3. Comment signaler un défaut">
        <p>Pour ouvrir une demande de retour pour défaut :</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            Écrivez-nous à{" "}
            <a href="mailto:support@resistnco.ca" className="text-red-600 hover:underline">
              support@resistnco.ca
            </a>{" "}
            en indiquant votre numéro de commande.
          </li>
          <li>
            Joignez une ou plusieurs photos claires du défaut ainsi que de l'étiquette du
            produit.
          </li>
          <li>
            Précisez si vous souhaitez un remboursement ou un échange (remplacement
            identique).
          </li>
        </ol>
        <p>
          Nous accusons réception de votre demande dans les 2 jours ouvrables et nous vous
          communiquons la marche à suivre. Aucun article ne doit être renvoyé sans notre
          accord préalable.
        </p>
      </Section>

      <Section title="4. Processus de remboursement">
        <p>
          Une fois le défaut confirmé, le remboursement est effectué sur le moyen de paiement
          original dans les 5 à 10 jours ouvrables, selon votre institution financière. Les
          frais d'expédition ne sont pas remboursables sauf si la commande entière est
          remboursée.
        </p>
        <p>
          Pour un échange, le produit de remplacement est expédié sans frais supplémentaires
          dès confirmation du défaut.
        </p>
      </Section>

      <Section title="5. Erreurs de commande">
        <p>
          Si vous recevez un article différent de celui que vous avez commandé (mauvais
          produit, mauvaise taille ou mauvaise couleur par rapport à votre bon de commande),
          il s'agit d'une erreur de notre part. Contactez-nous dans les 30 jours : nous
          organisons le renvoi du bon article à nos frais et le remboursement ou la reprise de
          l'article erroné.
        </p>
      </Section>

      <Section title="6. Commandes annulées">
        <p>
          Une commande peut être annulée sans frais tant que la production n'a pas débuté,
          soit généralement dans les 6 heures suivant la commande. Une fois la production
          lancée chez le fournisseur d'impression à la demande, l'annulation n'est plus
          possible. Contactez-nous le plus rapidement possible à{" "}
          <a href="mailto:support@resistnco.ca" className="text-red-600 hover:underline">
            support@resistnco.ca
          </a>{" "}
          pour toute demande d'annulation.
        </p>
      </Section>

      <Section title="7. Contact">
        <p>
          Pour toute question relative aux retours ou aux remboursements, écrivez-nous à{" "}
          <a href="mailto:support@resistnco.ca" className="text-red-600 hover:underline">
            support@resistnco.ca
          </a>{" "}
          ou passez par notre{" "}
          <Link href="/contact" className="text-red-600 hover:underline">
            formulaire de contact
          </Link>
          . Nous répondons sous 1 à 2 jours ouvrables, du lundi au vendredi (heure de l'Est).
        </p>
      </Section>
    </LegalLayout>
  );
}

export default LegalLayout;
