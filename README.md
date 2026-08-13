# Resist N Co — Boutique en ligne

Site e-commerce de vêtements aux logos engagés politiquement (gauche, pro-environnement, antifasciste). Print-on-demand, paiements Stripe et Interac, panneau d'administration complet.

## Démarrage

```bash
# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditez .env avec vos clés API

# Créer la base de données et générer le client Prisma
npx prisma db push
npx prisma generate

# Initialiser les données (produits, admin, paramètres)
npx tsx server/seed.ts

# Démarrer le serveur de développement
npm run dev
```

Le site est accessible sur `http://localhost:5000`.

## Architecture

```
boutique-perso/
├── prisma/
│   └── schema.prisma          # Schéma de base de données (13+ entités)
├── server/
│   ├── index.ts               # Point d'entrée Express
│   ├── routes.ts              # Routes API (publiques + admin)
│   ├── seed.ts                # Données initiales
│   └── lib/
│       ├── prisma.ts          # Client Prisma singleton
│       ├── services.ts        # Taxes, livraison, prix, numéros de commande
│       ├── stripe.ts          # Stripe Checkout + Webhook
│       ├── email.ts           # Emails transactionnels (Resend)
│       ├── auth.ts            # Authentification admin
│       └── pod/
│           ├── provider.ts    # Interface POD abstraite
│           ├── fulfillment.ts # Envoi de commandes aux fournisseurs POD
│           └── providers/
│               ├── printful.ts
│               ├── printify.ts
│               └── gooten.ts
├── client/
│   └── src/
│       ├── pages/             # Pages publiques et admin
│       ├── components/        # Composants UI (shadcn/ui)
│       └── lib/               # Cart, theme, queryClient
└── shared/
    └── schema.ts              # Types partagés
```

## Base de données

Le projet utilise Prisma avec SQLite en développement. Pour la production, changez `DATABASE_URL` dans `.env` pour une URL PostgreSQL :

```
DATABASE_URL="postgresql://user:password@localhost:5432/resistnco"
```

Puis exécutez :
```bash
npx prisma migrate deploy
npx prisma generate
npx tsx server/seed.ts
```

## Paiements

### Stripe (cartes de crédit)
1. Ajoutez `STRIPE_SECRET_KEY` et `STRIPE_PUBLISHABLE_KEY` dans `.env`
2. Configurez le webhook : `POST /api/webhooks/stripe`
3. Ajoutez `STRIPE_WEBHOOK_SECRET` dans `.env`
4. Le webhook gère : `checkout.session.completed`, `payment_intent.payment_failed`, `checkout.session.expired`, `charge.refunded`

### Interac e-Transfer
1. Configurez `INTERAC_EMAIL` dans `.env`
2. Le client reçoit les instructions par courriel
3. L'admin confirme manuellement le paiement dans le panneau d'administration
4. La commande est ensuite envoyée au fournisseur POD

## Fournisseurs Print-on-Demand

| Fournisseur | Variable d'environnement | Statut |
|------------|--------------------------|--------|
| Printful    | `PRINTFUL_API_KEY`       | Nécessite une clé |
| Printify    | `PRINTIFY_API_TOKEN` + `PRINTIFY_SHOP_ID` | Nécessite des clés |
| Gooten     | `GOOTEN_API_KEY`          | Nécessite une clé |

Les commandes sont envoyées au fournisseur POD uniquement après confirmation du paiement (Stripe webhook ou confirmation manuelle Interac).

## Emails (Resend)

1. Ajoutez `EMAIL_API_KEY` dans `.env`
2. Configurez `EMAIL_FROM` (expéditeur)
3. Emails envoyés : confirmation de commande, instructions Interac, paiement confirmé, paiement échoué, expédition, livraison, remboursement

## Administration

- URL : `/#/admin/login`
- Identifiants par défaut : `admin@resistnco.ca` / `ChangeMeNow123!`
- **Changez le mot de passe après la première connexion**

Le panneau admin permet de :
- Voir les statistiques de ventes (jour, semaine, mois)
- Gérer les commandes (confirmer Interac, renvoyer POD, suivre, annuler)
- Gérer les produits (prix, statut actif)
- Voir le statut des fournisseurs POD
- Modifier les paramètres (livraison, taxes, Interac)

## Taxes canadiennes

| Province | TPS | Taxe provinciale | Total |
|----------|-----|-----------------|-------|
| Québec | 5% | TVQ 9.975% | 14.975% |
| Ontario | 5% | TVH 8% | 13% |
| NB, NS, PE, NL | 5% | TVH 10% | 15% |
| BC | 5% | TVP 7% | 12% |
| AB, YT, NT, NU | 5% | Aucune | 5% |

## Livraison

- Tarif plat : 9.99 $ CAD
- Gratuit dès 75 $ CAD
- Délai de production POD : 2-7 jours ouvrables
- Délai de livraison : 3-10 jours ouvrables

## Sécurité

- Les clés API ne sont jamais dans le code source (variables d'environnement uniquement)
- Le frontend ne décide jamais qu'une commande est payée (le webhook Stripe est la source de vérité)
- Les prix sont validés côté serveur (jamais confiance au navigateur)
- Idempotence des webhooks (table WebhookEvent)
- En-têtes de sécurité (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- Sessions admin avec cookies httpOnly

## SEO

- `sitemap.xml` généré dynamiquement
- `robots.txt` configuré
- Métadonnées par page

## Production

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

## Clés API requises

| Service | Variable | Où l'obtenir |
|---------|----------|-------------|
| Stripe | `STRIPE_SECRET_KEY` | https://dashboard.stripe.com/apikeys |
| Stripe | `STRIPE_PUBLISHABLE_KEY` | https://dashboard.stripe.com/apikeys |
| Stripe | `STRIPE_WEBHOOK_SECRET` | https://dashboard.stripe.com/webhooks |
| Resend | `EMAIL_API_KEY` | https://resend.com/api-keys |
| Printful | `PRINTFUL_API_KEY` | https://www.printful.com/dashboard/settings/api |
| Printify | `PRINTIFY_API_TOKEN` | https://printify.com/app/settings/api-tokens |
| Printify | `PRINTIFY_SHOP_ID` | https://printify.com/app/shops |
| Gooten | `GOOTEN_API_KEY` | https://www.gooten.com/admin/api-keys |

## Licence

© 2026 Resist N Co. Tous droits réservés.
