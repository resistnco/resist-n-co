// Viewer Connector Bridge — calls external tools as the authenticated viewer
// Following the programmatic-tool-calling skill's shared artifact bridge protocol

export interface ConnectorResult {
  success: boolean;
  data?: unknown;
  error?: string;
  needsAuth?: boolean;
}

export function callViewerConnector(
  sourceId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<ConnectorResult> {
  const requestId = crypto.randomUUID();

  return new Promise((resolve) => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const onMessage = (event: MessageEvent) => {
      if (
        event.source !== window.parent ||
        event.data?.type !== "PPLX_ARTIFACT_CONNECTOR_TOOL_RESPONSE" ||
        event.data?.requestId !== requestId
      )
        return;

      window.clearTimeout(timeoutId);
      window.removeEventListener("message", onMessage);

      const result = event.data.result;
      if (result.status === "success") {
        resolve({ success: true, data: result.content });
      } else if (result.code === "auth_required" || result.status === "auth_required") {
        resolve({ success: false, error: "Connexion requise", needsAuth: true });
      } else {
        resolve({ success: false, error: result.code || result.status || "Erreur inconnue" });
      }
    };

    timeoutId = setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve({ success: false, error: "Bridge indisponible" });
    }, 15000);

    window.addEventListener("message", onMessage);
    window.parent.postMessage(
      {
        type: "PPLX_ARTIFACT_CONNECTOR_TOOL_REQUEST",
        requestId,
        sourceId,
        toolName,
        arguments: args,
      },
      "*"
    );
  });
}

export interface ConnectorInfo {
  sourceId: string;
  name: string;
  description: string;
  icon: string;
  tools: { name: string; label: string; description: string }[];
}

export const CONNECTORS: ConnectorInfo[] = [
  {
    sourceId: "squarespace__pipedream",
    name: "Squarespace",
    description: "Synchronisation du catalogue de produits",
    icon: "squarespace",
    tools: [
      { name: "squarespace-list-store-page-id-options", label: "Lister les pages boutique", description: "Récupère les options de pages boutique" },
      { name: "squarespace-get-product", label: "Obtenir un produit", description: "Récupère un produit spécifique" },
      { name: "squarespace-create-product", label: "Créer un produit", description: "Crée un nouveau produit" },
      { name: "squarespace-get-order", label: "Obtenir une commande", description: "Récupère une commande spécifique" },
    ],
  },
  {
    sourceId: "meta_ads",
    name: "Meta Ads",
    description: "Gestion des campagnes publicitaires Facebook & Instagram",
    icon: "meta",
    tools: [
      { name: "ads_get_ad_accounts", label: "Comptes publicitaires", description: "Liste les comptes publicitaires" },
      { name: "ads_get_ad_entities", label: "Entités publicitaires", description: "Récupère les données de campagnes" },
      { name: "ads_create_campaign", label: "Créer une campagne", description: "Crée une nouvelle campagne" },
      { name: "ads_library_search", label: "Recherche bibliothèque", description: "Recherche dans la bibliothèque publicitaire" },
      { name: "ads_get_opportunity_score", label: "Score d'opportunité", description: "Recommandations d'optimisation" },
    ],
  },
  {
    sourceId: "google_vertex_ai__pipedream",
    name: "Google Vertex AI",
    description: "IA pour l'analyse d'images et génération de contenu",
    icon: "vertex",
    tools: [
      { name: "google_vertex_ai-analyze-image-video", label: "Analyser une image", description: "Examine une image avec instructions" },
      { name: "google_vertex_ai-classify-text", label: "Classifier du texte", description: "Catégorise du texte" },
      { name: "google_vertex_ai-analyze-text-sentiment", label: "Analyser le sentiment", description: "Analyse le sentiment d'un texte" },
      { name: "google_vertex_ai-generate-video-from-text", label: "Générer vidéo", description: "Génère une vidéo depuis un texte" },
    ],
  },
  {
    sourceId: "herobot_chatbot_marketing__pipedream",
    name: "HeroBot Chatbot",
    description: "Chatbot marketing et support client automatisé",
    icon: "herobot",
    tools: [
      { name: "herobot_chatbot_marketing-send-message", label: "Envoyer un message", description: "Envoie un message à un utilisateur" },
      { name: "herobot_chatbot_marketing-create-user", label: "Créer un utilisateur", description: "Crée un nouveau contact" },
      { name: "herobot_chatbot_marketing-create-custom-field", label: "Créer un champ", description: "Crée un champ personnalisé" },
    ],
  },
  {
    sourceId: "facebook_pages__pipedream",
    name: "Facebook Pages",
    description: "Publication et gestion des pages Facebook",
    icon: "facebook",
    tools: [
      { name: "facebook_pages-create-post", label: "Créer une publication", description: "Publie sur la page Facebook" },
      { name: "facebook_pages-list-posts", label: "Lister les publications", description: "Récupère les publications" },
      { name: "facebook_pages-get-page", label: "Infos de la page", description: "Récupère les informations de la page" },
    ],
  },
];
