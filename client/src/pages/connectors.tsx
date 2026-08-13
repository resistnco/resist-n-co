import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONNECTORS, callViewerConnector, type ConnectorInfo } from "@/lib/connectors";
import { useToast } from "@/hooks/use-toast";

interface ConnectorState {
  loading: boolean;
  result: string | null;
  error: string | null;
  needsAuth: boolean;
}

export function ConnectorsPage() {
  const { toast } = useToast();
  const [states, setStates] = useState<Record<string, ConnectorState>>({});
  const [facebookMessage, setFacebookMessage] = useState("");
  const [vertexPrompt, setVertexPrompt] = useState("");
  const [herobotMessage, setHerobotMessage] = useState("");

  const callTool = async (sourceId: string, toolName: string, args: Record<string, unknown>, label: string) => {
    const key = `${sourceId}-${toolName}`;
    setStates((s) => ({ ...s, [key]: { loading: true, result: null, error: null, needsAuth: false } }));

    const result = await callViewerConnector(sourceId, toolName, args);

    if (result.success) {
      const dataStr = typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2);
      const truncated = dataStr.length > 500 ? dataStr.substring(0, 500) + "..." : dataStr;
      setStates((s) => ({ ...s, [key]: { loading: false, result: truncated, error: null, needsAuth: false } }));
      toast({ title: `${label} réussi`, description: "Données reçues du connecteur" });
    } else {
      setStates((s) => ({ ...s, [key]: { loading: false, result: null, error: result.error || "Erreur", needsAuth: result.needsAuth || false } }));
      toast({ title: `${label} échoué`, description: result.error || "Erreur inconnue", variant: "destructive" });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-display text-xl md:text-2xl font-bold mb-2">Intégrations connectées</h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos services connectés et interagissez avec eux directement depuis votre boutique.
          Les connecteurs utilisent votre authentification personnelle de manière sécurisée.
        </p>
      </div>

      {/* Connector cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {CONNECTORS.map((connector) => (
          <ConnectorCard key={connector.sourceId} connector={connector} />
        ))}
      </div>

      {/* Action panels */}
      <div className="space-y-6">
        {/* Facebook Pages — Publish post */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#1877F2] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 5.99 4.39 10.95 10.13 11.85V15.47H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.24 2.69.24v2.95h-1.52c-1.49 0-1.96.93-1.96 1.87v2.18h3.33l-.53 3.47h-2.8v8.38C19.61 22.95 24 17.99 24 12z"/></svg>
            </div>
            <div>
              <h2 className="font-semibold text-sm">Publier sur Facebook</h2>
              <p className="text-xs text-muted-foreground">Facebook Pages</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="fb-message" className="text-xs">Message de la publication</Label>
              <Textarea
                id="fb-message"
                value={facebookMessage}
                onChange={(e) => setFacebookMessage(e.target.value)}
                placeholder="Nouveaux designs disponibles! Découvrez notre collection..."
                className="mt-1"
                data-testid="input-facebook-message"
              />
            </div>
            <Button
              size="sm"
              onClick={() => callTool(
                "facebook_pages__pipedream",
                "facebook_pages-create-post",
                { message: facebookMessage || "Test de publication depuis Resist N Co" },
                "Publication Facebook"
              )}
              disabled={states["facebook_pages__pipedream-facebook_pages-create-post"]?.loading}
              data-testid="button-facebook-publish"
            >
              {states["facebook_pages__pipedream-facebook_pages-create-post"]?.loading ? "Publication..." : "Publier"}
            </Button>
            <ResultDisplay state={states["facebook_pages__pipedream-facebook_pages-create-post"]} />
          </div>
        </Card>

        {/* Google Vertex AI — Analyze image */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#4285F4] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.5 8 12 11.82 4.5 8 12 4.18z"/></svg>
            </div>
            <div>
              <h2 className="font-semibold text-sm">IA — Analyse d'image</h2>
              <p className="text-xs text-muted-foreground">Google Vertex AI</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="vertex-prompt" className="text-xs">Instructions d'analyse</Label>
              <Textarea
                id="vertex-prompt"
                value={vertexPrompt}
                onChange={(e) => setVertexPrompt(e.target.value)}
                placeholder="Décrivez ce produit et suggérez des améliorations de design..."
                className="mt-1"
                data-testid="input-vertex-prompt"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => callTool(
                "google_vertex_ai__pipedream",
                "google_vertex_ai-analyze-image-video",
                { instructions: vertexPrompt || "Analyse ce design de vêtement", image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600" },
                "Analyse Vertex AI"
              )}
              disabled={states["google_vertex_ai__pipedream-google_vertex_ai-analyze-image-video"]?.loading}
              data-testid="button-vertex-analyze"
            >
              {states["google_vertex_ai__pipedream-google_vertex_ai-analyze-image-video"]?.loading ? "Analyse en cours..." : "Analyser"}
            </Button>
            <ResultDisplay state={states["google_vertex_ai__pipedream-google_vertex_ai-analyze-image-video"]} />
          </div>
        </Card>

        {/* Meta Ads — Get accounts */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0668E1] to-[#9C27B0] flex items-center justify-center text-white font-bold text-xs">
              META
            </div>
            <div>
              <h2 className="font-semibold text-sm">Campagnes publicitaires</h2>
              <p className="text-xs text-muted-foreground">Meta Ads — Comptes & opportunités</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => callTool("meta_ads", "ads_get_ad_accounts", {}, "Comptes Meta Ads")}
              disabled={states["meta_ads-ads_get_ad_accounts"]?.loading}
              data-testid="button-meta-accounts"
            >
              {states["meta_ads-ads_get_ad_accounts"]?.loading ? "Chargement..." : "Voir mes comptes"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => callTool("meta_ads", "ads_get_opportunity_score", {}, "Score d'opportunité")}
              disabled={states["meta_ads-ads_get_opportunity_score"]?.loading}
              data-testid="button-meta-opportunity"
            >
              {states["meta_ads-ads_get_opportunity_score"]?.loading ? "Chargement..." : "Score d'opportunité"}
            </Button>
          </div>
          <ResultDisplay state={states["meta_ads-ads_get_ad_accounts"]} />
          <ResultDisplay state={states["meta_ads-ads_get_opportunity_score"]} />
        </Card>

        {/* HeroBot — Send message */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#6C2BD9] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3 3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z"/>
                <path d="M5 12h14M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-sm">Chatbot — Support client</h2>
              <p className="text-xs text-muted-foreground">HeroBot Chatbot Marketing</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="herobot-msg" className="text-xs">Message à envoyer</Label>
              <Input
                id="herobot-msg"
                value={herobotMessage}
                onChange={(e) => setHerobotMessage(e.target.value)}
                placeholder="Bienvenue! Comment puis-je vous aider?"
                className="mt-1"
                data-testid="input-herobot-message"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => callTool(
                "herobot_chatbot_marketing__pipedream",
                "herobot_chatbot_marketing-list-user-id-options",
                {},
                "Utilisateurs HeroBot"
              )}
              disabled={states["herobot_chatbot_marketing__pipedream-herobot_chatbot_marketing-list-user-id-options"]?.loading}
              data-testid="button-herobot-users"
            >
              {states["herobot_chatbot_marketing__pipedream-herobot_chatbot_marketing-list-user-id-options"]?.loading ? "Chargement..." : "Lister les utilisateurs"}
            </Button>
            <ResultDisplay state={states["herobot_chatbot_marketing__pipedream-herobot_chatbot_marketing-list-user-id-options"]} />
          </div>
        </Card>

        {/* Squarespace — Products */}
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#000] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
            </div>
            <div>
              <h2 className="font-semibold text-sm">Synchronisation catalogue</h2>
              <p className="text-xs text-muted-foreground">Squarespace Commerce</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => callTool(
                "squarespace__pipedream",
                "squarespace-list-store-page-id-options",
                {},
                "Pages boutique Squarespace"
              )}
              disabled={states["squarespace__pipedream-squarespace-list-store-page-id-options"]?.loading}
              data-testid="button-squarespace-pages"
            >
              {states["squarespace__pipedream-squarespace-list-store-page-id-options"]?.loading ? "Chargement..." : "Voir les pages boutique"}
            </Button>
          </div>
          <ResultDisplay state={states["squarespace__pipedream-squarespace-list-store-page-id-options"]} />
        </Card>
      </div>
    </div>
  );
}

function ConnectorCard({ connector }: { connector: ConnectorInfo }) {
  const iconMap: Record<string, { bg: string; label: string }> = {
    squarespace: { bg: "bg-black", label: "SQ" },
    meta: { bg: "bg-gradient-to-br from-[#0668E1] to-[#9C27B0]", label: "META" },
    vertex: { bg: "bg-[#4285F4]", label: "AI" },
    herobot: { bg: "bg-[#6C2BD9]", label: "HB" },
    facebook: { bg: "bg-[#1877F2]", label: "f" },
  };
  const icon = iconMap[connector.icon] || { bg: "bg-primary", label: "?" };

  return (
    <Card className="p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg ${icon.bg} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
        {icon.label}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sm">{connector.name}</h3>
          <Badge variant="outline" className="text-xs">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-1 connector-pulse" />
            Connecté
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-2">{connector.description}</p>
        <div className="flex flex-wrap gap-1">
          {connector.tools.slice(0, 3).map((tool) => (
            <Badge key={tool.name} variant="secondary" className="text-xs font-normal">
              {tool.label}
            </Badge>
          ))}
          {connector.tools.length > 3 && (
            <Badge variant="secondary" className="text-xs">+{connector.tools.length - 3}</Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

function ResultDisplay({ state }: { state?: ConnectorState }) {
  if (!state) return null;
  if (state.loading) {
    return (
      <div className="mt-3 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground animate-pulse">
        Chargement...
      </div>
    );
  }
  if (state.needsAuth) {
    return (
      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs">
        <p className="font-medium text-yellow-600 dark:text-yellow-400">Connexion requise</p>
        <p className="text-muted-foreground">Veuillez connecter ce service pour utiliser cette fonctionnalité.</p>
      </div>
    );
  }
  if (state.error) {
    return (
      <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs">
        <p className="font-medium text-destructive">Erreur</p>
        <p className="text-muted-foreground">{state.error}</p>
      </div>
    );
  }
  if (state.result) {
    return (
      <div className="mt-3 p-3 bg-muted/50 rounded-lg">
        <p className="text-xs font-medium mb-1 text-green-600 dark:text-green-400">Résultat:</p>
        <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">{state.result}</pre>
      </div>
    );
  }
  return null;
}
