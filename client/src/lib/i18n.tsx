import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Lang = "fr" | "en";

type Dict = Record<string, { fr: string; en: string }>;

/* -------------------------------------------------------------------------- */
/* Dictionary                                                                  */
/* -------------------------------------------------------------------------- */

const dict: Dict = {
  // Nav / Header
  "nav.collection": { fr: "Collection", en: "Collection" },
  "nav.designer": { fr: "Créer mon design", en: "Create My Design" },
  "nav.cart": { fr: "Panier", en: "Cart" },
  "nav.menu": { fr: "Menu", en: "Menu" },
  "nav.theme": { fr: "Changer le thème", en: "Toggle theme" },

  // Footer
  "footer.tagline": {
    fr: "Vêtements et accessoires aux logos engagés. Résistez, organisez-vous, habillez vos convictions.",
    en: "Clothing and accessories with engaged logos. Resist, organize, wear your convictions.",
  },
  "footer.collection": { fr: "Collection", en: "Collection" },
  "footer.allProducts": { fr: "Tous les produits", en: "All products" },
  "footer.createDesign": { fr: "Créer un design", en: "Create a design" },
  "footer.myCart": { fr: "Mon panier", en: "My cart" },
  "footer.help": { fr: "Aide", en: "Help" },
  "footer.faq": { fr: "Foire aux questions", en: "FAQ" },
  "footer.contact": { fr: "Nous joindre", en: "Contact us" },
  "footer.reportDefect": { fr: "Signaler un défaut", en: "Report a defect" },
  "footer.legal": { fr: "Légal", en: "Legal" },
  "footer.privacy": { fr: "Politique de confidentialité", en: "Privacy Policy" },
  "footer.terms": { fr: "Conditions d'utilisation", en: "Terms of Use" },
  "footer.shipping": { fr: "Expédition & livraison", en: "Shipping & Delivery" },
  "footer.returns": { fr: "Retours & remboursements", en: "Returns & Refunds" },
  "footer.values": { fr: "Nos valeurs", en: "Our Values" },
  "footer.organicCotton": { fr: "Coton biologique éthique", en: "Ethical organic cotton" },
  "footer.printOnDemand": { fr: "Impression à la demande", en: "Print on demand" },
  "footer.deliveryCanada": { fr: "Livraison Canada 7-14 jours", en: "Canada delivery 7-14 days" },
  "footer.defectReplaced": { fr: "Défaut remplacé sous 30 jours", en: "Defect replaced within 30 days" },
  "footer.copyright": { fr: "Pas de planète B.", en: "No Planet B." },

  // Home / Hero
  "home.badge": { fr: "Militant · Écologiste · Antifasciste", en: "Activist · Eco · Antifascist" },
  "home.title1": { fr: "Résistez.", en: "Resist." },
  "home.title2": { fr: "Habillez vos convictions.", en: "Wear Your Convictions." },
  "home.subtitle": {
    fr: "Vêtements et accessoires aux logos engagés. T-shirts, hoodies, tuques et plus. Impression à la demande, coton biologique, livraison partout au Canada.",
    en: "Clothing and accessories with engaged logos. T-shirts, hoodies, beanies and more. Print on demand, organic cotton, delivered across Canada.",
  },
  "home.ctaDesign": { fr: "Créer mon design →", en: "Create My Design →" },
  "home.ctaCollection": { fr: "Voir la collection", en: "View Collection" },

  // Feature bar
  "feature.pod": { fr: "Impression à la demande", en: "Print on demand" },
  "feature.podDesc": { fr: "Chaque pièce imprimée à la commande", en: "Each piece printed to order" },
  "feature.secure": { fr: "Paiement sécurisé", en: "Secure payment" },
  "feature.secureDesc": { fr: "Stripe & Interac e-Transfer", en: "Stripe & Interac e-Transfer" },
  "feature.delivery": { fr: "Livraison Canada", en: "Canada delivery" },
  "feature.deliveryDesc": { fr: "5-10 jours ouvrables", en: "5-10 business days" },
  "feature.organic": { fr: "Coton biologique", en: "Organic cotton" },
  "feature.organicDesc": { fr: "Éthique et durable", en: "Ethical and sustainable" },

  // Collection
  "home.collectionTitle": { fr: "La Collection", en: "The Collection" },
  "cat.tshirt": { fr: "T-Shirts", en: "T-Shirts" },
  "cat.hoodie": { fr: "Hoodies", en: "Hoodies" },
  "cat.tuque": { fr: "Tuques", en: "Beanies" },
  "cat.accessory": { fr: "Accessoires", en: "Accessories" },
  "home.allProducts": { fr: "Tous les produits", en: "All products" },
  "home.loading": { fr: "Chargement…", en: "Loading…" },
  "home.noProducts": { fr: "Aucun produit trouvé.", en: "No products found." },

  // Product page
  "product.chooseSize": { fr: "Veuillez choisir une taille", en: "Please choose a size" },
  "product.chooseColor": { fr: "Veuillez choisir une couleur", en: "Please choose a color" },
  "product.addedToCart": { fr: "Ajouté au panier", en: "Added to cart" },
  "product.addToCart": { fr: "Ajouter au panier", en: "Add to Cart" },
  "product.size": { fr: "Taille", en: "Size" },
  "product.color": { fr: "Couleur", en: "Color" },
  "product.description": { fr: "Description", en: "Description" },
  "product.supplier": { fr: "Fourni par", en: "Fulfilled by" },
  "product.back": { fr: "Boutique", en: "Shop" },
  "product.from": { fr: "À partir de", en: "From" },

  // Cart
  "cart.title": { fr: "Mon panier", en: "My Cart" },
  "cart.empty": { fr: "Votre panier est vide", en: "Your cart is empty" },
  "cart.emptyDesc": { fr: "Parcourez la collection et ajoutez vos pièces préférées.", en: "Browse the collection and add your favorite pieces." },
  "cart.browse": { fr: "Voir la collection", en: "Browse collection" },
  "cart.subtotal": { fr: "Sous-total", en: "Subtotal" },
  "cart.shipping": { fr: "Livraison", en: "Shipping" },
  "cart.free": { fr: "Gratuite", en: "Free" },
  "cart.freeThreshold": { fr: "Livraison gratuite à partir de 75 $", en: "Free shipping over $75" },
  "cart.tps": { fr: "TPS (5%)", en: "GST (5%)" },
  "cart.tvq": { fr: "TVQ (9,975%)", en: "QST (9.975%)" },
  "cart.total": { fr: "Total", en: "Total" },
  "cart.checkout": { fr: "Passer la commande", en: "Checkout" },
  "cart.remove": { fr: "Retirer", en: "Remove" },
  "cart.qty": { fr: "Qté", en: "Qty" },
  "cart.product": { fr: "Produit", en: "Product" },
  "cart.price": { fr: "Prix", en: "Price" },
  "cart.beforeTaxes": { fr: "avant taxes", en: "before taxes" },

  // Checkout
  "checkout.title": { fr: "Commande", en: "Checkout" },
  "checkout.contact": { fr: "Coordonnées", en: "Contact" },
  "checkout.email": { fr: "Courriel", en: "Email" },
  "checkout.shipping": { fr: "Adresse de livraison", en: "Shipping address" },
  "checkout.firstName": { fr: "Prénom", en: "First name" },
  "checkout.lastName": { fr: "Nom", en: "Last name" },
  "checkout.address": { fr: "Adresse", en: "Address" },
  "checkout.city": { fr: "Ville", en: "City" },
  "checkout.province": { fr: "Province", en: "Province" },
  "checkout.postalCode": { fr: "Code postal", en: "Postal code" },
  "checkout.country": { fr: "Pays", en: "Country" },
  "checkout.payment": { fr: "Paiement", en: "Payment" },
  "checkout.payWithStripe": { fr: "Payer par carte (Stripe)", en: "Pay by card (Stripe)" },
  "checkout.payWithInterac": { fr: "Payer avec Interac", en: "Pay with Interac" },
  "checkout.processing": { fr: "Traitement…", en: "Processing…" },
  "checkout.summary": { fr: "Résumé de la commande", en: "Order summary" },
  "checkout.items": { fr: "articles", en: "items" },
  "checkout.redirecting": { fr: "Redirection vers Stripe…", en: "Redirecting to Stripe…" },
  "checkout.canadaOnly": { fr: "Livraison au Canada uniquement", en: "Canada delivery only" },

  // Payment success
  "paySuccess.title": { fr: "Paiement confirmé", en: "Payment Confirmed" },
  "paySuccess.thankYou": { fr: "Merci pour votre commande !", en: "Thank you for your order!" },
  "paySuccess.orderNumber": { fr: "Numéro de commande", en: "Order number" },
  "paySuccess.total": { fr: "Total payé", en: "Total paid" },
  "paySuccess.emailSent": { fr: "Un courriel de confirmation vous a été envoyé.", en: "A confirmation email has been sent to you." },
  "paySuccess.continueShopping": { fr: "Continuer mes achats", en: "Continue shopping" },
  "paySuccess.viewOrder": { fr: "Voir ma commande", en: "View my order" },
  "paySuccess.loading": { fr: "Chargement de votre commande…", en: "Loading your order…" },
  "paySuccess.notFound": { fr: "Commande introuvable", en: "Order not found" },
  "paySuccess.notFoundDesc": { fr: "Si vous venez de payer, votre commande est en cours de traitement.", en: "If you just paid, your order is being processed." },

  // Payment failure
  "payFail.title": { fr: "Paiement échoué", en: "Payment Failed" },
  "payFail.desc": { fr: "Le paiement n'a pas pu être traité. Aucun montant n'a été débité.", en: "The payment could not be processed. No amount was charged." },
  "payFail.retry": { fr: "Réessayer", en: "Try again" },
  "payFail.contact": { fr: "Nous contacter", en: "Contact us" },

  // Contact
  "contact.title": { fr: "Nous joindre", en: "Contact Us" },
  "contact.subtitle": { fr: "Une question ? Un problème avec votre commande ? Écrivez-nous.", en: "A question? An issue with your order? Write to us." },
  "contact.email": { fr: "Courriel", en: "Email" },
  "contact.responseTime": { fr: "Réponse sous 1-2 jours ouvrables", en: "Reply within 1-2 business days" },
  "contact.beforeWrite": { fr: "Avant de nous écrire", en: "Before you write" },
  "contact.beforeWriteDesc": {
    fr: "Pour un défaut d'impression ou un produit endommagé, incluez une photo claire du défaut. Vous avez 30 jours suivant la livraison pour signaler un problème.",
    en: "For a print defect or damaged product, include a clear photo of the defect. You have 30 days after delivery to report an issue.",
  },
  "contact.form.name": { fr: "Nom", en: "Name" },
  "contact.form.email": { fr: "Votre courriel", en: "Your email" },
  "contact.form.orderNumber": { fr: "Numéro de commande (optionnel)", en: "Order number (optional)" },
  "contact.form.subject": { fr: "Sujet", en: "Subject" },
  "contact.form.subjectOrder": { fr: "Question sur ma commande", en: "Question about my order" },
  "contact.form.subjectDefect": { fr: "Produit défectueux", en: "Defective product" },
  "contact.form.subjectOther": { fr: "Autre", en: "Other" },
  "contact.form.message": { fr: "Message", en: "Message" },
  "contact.form.send": { fr: "Envoyer", en: "Send" },
  "contact.form.sending": { fr: "Envoi…", en: "Sending…" },
  "contact.form.sent": { fr: "Message envoyé ! Nous vous répondrons sous 1-2 jours ouvrables.", en: "Message sent! We'll reply within 1-2 business days." },

  // FAQ
  "faq.title": { fr: "Foire aux questions", en: "Frequently Asked Questions" },
  "faq.subtitle": { fr: "Tout ce que vous devez savoir sur vos commandes, la livraison et nos produits.", en: "Everything you need to know about your orders, shipping, and our products." },

  // Legal
  "legal.privacyTitle": { fr: "Politique de confidentialité", en: "Privacy Policy" },
  "legal.termsTitle": { fr: "Conditions d'utilisation", en: "Terms of Use" },
  "legal.shippingTitle": { fr: "Expédition & livraison", en: "Shipping & Delivery" },
  "legal.returnsTitle": { fr: "Politique de retour", en: "Return Policy" },
  "legal.lastUpdated": { fr: "Dernière mise à jour", en: "Last updated" },
  "legal.questions": { fr: "Des questions sur cette politique ?", en: "Questions about this policy?" },

  // Designer
  "designer.title": { fr: "Créer mon design", en: "Create My Design" },
  "designer.subtitle": { fr: "Concevez votre propre vêtement militant.", en: "Design your own activist clothing." },

  // Not found
  "notfound.title": { fr: "Page introuvable", en: "Page Not Found" },
  "notfound.desc": { fr: "La page que vous cherchez n'existe pas.", en: "The page you're looking for doesn't exist." },
  "notfound.home": { fr: "Retour à la boutique", en: "Back to shop" },

  // Common
  "common.loading": { fr: "Chargement…", en: "Loading…" },
  "common.error": { fr: "Une erreur est survenue", en: "An error occurred" },
  "common.retry": { fr: "Réessayer", en: "Try again" },
  "common.back": { fr: "Retour", en: "Back" },
};

/* -------------------------------------------------------------------------- */
/* Context                                                                     */
/* -------------------------------------------------------------------------- */

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Detect lang from URL hash query param (?lang=en)
  const getInitialLang = (): Lang => {
    if (typeof window === "undefined") return "fr";
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split("?")[1] || "");
    return params.get("lang") === "en" ? "en" : "fr";
  };

  const [lang, setLangState] = useState<Lang>(getInitialLang);

  // On mount, strip ?lang= param from hash so wouter routing isn't broken
  useState(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("?lang=")) {
        const route = hash.split("?")[0];
        window.history.replaceState(null, "", route);
      }
    }
    return null;
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "fr" ? "en" : "fr");
  }, [lang, setLang]);

  const t = useCallback(
    (key: string) => {
      const entry = dict[key];
      if (!entry) return key;
      return entry[lang];
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
