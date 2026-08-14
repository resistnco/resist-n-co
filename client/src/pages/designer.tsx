import { useRef, useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

// Load Fabric.js from CDN
declare global {
  interface Window {
    fabric: any;
  }
}

let fabricLoaded = false;
function loadFabric(): Promise<void> {
  return new Promise((resolve) => {
    if (fabricLoaded && window.fabric) return resolve();
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/fabric@5.3.0/dist/fabric.min.js";
    script.onload = () => {
      fabricLoaded = true;
      resolve();
    };
    script.onerror = () => resolve(); // Graceful fallback
    document.head.appendChild(script);
  });
}

export function DesignerPage() {
  const { t } = useI18n();
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const productSlug = params.get("product") || "tshirt-classique";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [selectedTool, setSelectedTool] = useState<"select" | "text" | "shape" | "upload">("select");
  const [textContent, setTextContent] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [textSize, setTextSize] = useState(28);
  const [textFont, setTextFont] = useState("Arial");
  const [garmentColor, setGarmentColor] = useState("#ffffff");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [fabricReady, setFabricReady] = useState(false);

  const { addToCart } = useCart();
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", productSlug],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/products/${productSlug}`);
      return res.json();
    },
  });

  // Initialize Fabric canvas
  useEffect(() => {
    loadFabric().then(() => {
      if (!window.fabric || !canvasRef.current) return;
      const canvas = new window.fabric.Canvas(canvasRef.current, {
        width: 400,
        height: 500,
        backgroundColor: garmentColor,
      });
      fabricCanvasRef.current = canvas;
      setFabricReady(true);

      // Design area boundary
      const boundary = new window.fabric.Rect({
        left: 50,
        top: 100,
        width: 300,
        height: 300,
        fill: "transparent",
        stroke: "#999",
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      canvas.add(boundary);

      canvas.on("selection:created", () => setSelectedTool("select"));
      canvas.on("selection:updated", () => setSelectedTool("select"));
      canvas.on("selection:cleared", () => setSelectedTool("select"));
    });

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  // Update background color
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.backgroundColor = garmentColor;
      fabricCanvasRef.current.renderAll();
    }
  }, [garmentColor]);

  // Set product defaults
  useEffect(() => {
    if (product) {
      const colors: { name: string; hex: string }[] = (typeof product.colors === "string" ? JSON.parse(product.colors) : product.colors) as any;
      if (colors.length > 0) {
        setGarmentColor(colors[0].hex);
        setSelectedColor(colors[0].name);
      }
      const sizes: string[] = (typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes) as any;
      if (sizes.length > 0) setSelectedSize(sizes[0]);
    }
  }, [product]);

  const addText = useCallback(() => {
    if (!fabricCanvasRef.current || !textContent) return;
    const text = new window.fabric.IText(textContent, {
      left: 200,
      top: 250,
      fontFamily: textFont,
      fontSize: textSize,
      fill: textColor,
      originX: "center",
      originY: "center",
      editable: true,
    });
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
    setTextContent("");
  }, [textContent, textFont, textSize, textColor]);

  const addShape = useCallback((shape: string) => {
    if (!fabricCanvasRef.current) return;
    let obj;
    const props = {
      left: 200,
      top: 250,
      originX: "center",
      originY: "center",
      fill: textColor,
      stroke: "#333",
      strokeWidth: 2,
    };
    switch (shape) {
      case "rect":
        obj = new window.fabric.Rect({ ...props, width: 100, height: 80 });
        break;
      case "circle":
        obj = new window.fabric.Circle({ ...props, radius: 50 });
        break;
      case "triangle":
        obj = new window.fabric.Triangle({ ...props, width: 100, height: 100 });
        break;
      case "line":
        obj = new window.fabric.Line([0, 0, 120, 0], { ...props, height: 4, fill: textColor, stroke: textColor });
        break;
      default:
        return;
    }
    fabricCanvasRef.current.add(obj);
    fabricCanvasRef.current.setActiveObject(obj);
    fabricCanvasRef.current.renderAll();
  }, [textColor]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      window.fabric.Image.fromURL(event.target?.result as string, (img: any) => {
        img.scaleToWidth(150);
        img.set({ left: 200, top: 250, originX: "center", originY: "center" });
        fabricCanvasRef.current.add(img);
        fabricCanvasRef.current.setActiveObject(img);
        fabricCanvasRef.current.renderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const deleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const active = fabricCanvasRef.current.getActiveObject();
    if (active && active.type !== "rect") {
      fabricCanvasRef.current.remove(active);
      fabricCanvasRef.current.renderAll();
    }
  }, []);

  const clearCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const objects = fabricCanvasRef.current.getObjects();
    objects.forEach((obj: any) => {
      if (obj.strokeDashArray) return; // Keep boundary
      fabricCanvasRef.current.remove(obj);
    });
    fabricCanvasRef.current.renderAll();
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (!product || !fabricCanvasRef.current) return;
    if (!selectedSize || !selectedColor) {
      toast({ title: "Veuillez sélectionner la taille et la couleur", variant: "destructive" });
      return;
    }

    // Export design as PNG
    const dataURL = fabricCanvasRef.current.toDataURL({
      format: "png",
      quality: 1,
    });

    // Get design data as JSON
    const designData = JSON.stringify(fabricCanvasRef.current.toJSON());

    await addToCart({
      productId: product.id,
      quantity: 1,
      size: selectedSize,
      color: selectedColor,
      designData,
      designPreview: dataURL,
      price: product.basePrice,
      productName: product.name,
      productImage: product.imageUrl,
    });

    toast({ title: "Design ajouté au panier", description: `${product.name} personnalisé` });
  }, [product, selectedSize, selectedColor, addToCart, toast]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Skeleton className="h-12 w-1/3 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[500px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[500px] rounded-xl" />
        </div>
      </div>
    );
  }

  const colors: { name: string; hex: string }[] = product ? (typeof product.colors === "string" ? JSON.parse(product.colors) : product.colors) as any : [];
  const sizes: string[] = product ? (typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes) as any : [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-bold">{t("designer.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("designer.subtitle")}</p>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm">{t("common.back")}</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas area */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <div className="flex justify-center bg-muted/30 rounded-lg p-4">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={500}
                  className="rounded-lg shadow-md"
                  style={{ touchAction: "none" }}
                />
                {!fabricReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                    <p className="text-sm text-muted-foreground">Chargement du studio...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Canvas toolbar */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Button
                variant={selectedTool === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTool("select")}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
                Sélectionner
              </Button>
              <Button variant="outline" size="sm" onClick={deleteSelected} data-testid="button-delete-element">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                Supprimer
              </Button>
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                Tout effacer
              </Button>
            </div>
          </Card>
        </div>

        {/* Tool panel */}
        <div className="space-y-4">
          {/* Garment color */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">Couleur du vêtement</h3>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => { setGarmentColor(c.hex); setSelectedColor(c.name); }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    garmentColor === c.hex ? "border-primary ring-2 ring-primary/20" : "border-border"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                  data-testid={`button-garment-color-${c.name}`}
                />
              ))}
            </div>
          </Card>

          {/* Tools */}
          <Card className="p-4">
            <Tabs defaultValue="text">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="text">Texte</TabsTrigger>
                <TabsTrigger value="shape">Formes</TabsTrigger>
                <TabsTrigger value="upload">Image</TabsTrigger>
              </TabsList>

              {/* Text tab */}
              <TabsContent value="text" className="space-y-3 mt-4">
                <div>
                  <Label htmlFor="text-input" className="text-xs">Votre texte</Label>
                  <Input
                    id="text-input"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Entrez votre texte..."
                    className="mt-1"
                    data-testid="input-design-text"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Couleur</Label>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full h-9 rounded-md border border-border cursor-pointer"
                      data-testid="input-text-color"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Taille</Label>
                    <Input
                      type="number"
                      value={textSize}
                      onChange={(e) => setTextSize(parseInt(e.target.value) || 28)}
                      min={8}
                      max={72}
                      className="mt-0"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Police</Label>
                  <select
                    value={textFont}
                    onChange={(e) => setTextFont(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Impact">Impact</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </div>
                <Button onClick={addText} size="sm" className="w-full" disabled={!textContent} data-testid="button-add-text">
                  Ajouter le texte
                </Button>
              </TabsContent>

              {/* Shape tab */}
              <TabsContent value="shape" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => addShape("rect")} data-testid="button-shape-rect">
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                    Rectangle
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addShape("circle")} data-testid="button-shape-circle">
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                    Cercle
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addShape("triangle")} data-testid="button-shape-triangle">
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 22h20L12 2z"/></svg>
                    Triangle
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addShape("line")} data-testid="button-shape-line">
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>
                    Ligne
                  </Button>
                </div>
                <div>
                  <Label className="text-xs">Couleur de remplissage</Label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full h-9 rounded-md border border-border cursor-pointer"
                  />
                </div>
              </TabsContent>

              {/* Upload tab */}
              <TabsContent value="upload" className="space-y-3 mt-4">
                <div>
                  <Label className="text-xs">Téléverser une image</Label>
                  <p className="text-xs text-muted-foreground mb-2">PNG, JPG (max 5 Mo). Transparent PNG recommandé.</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer hover:file:bg-primary/90"
                    data-testid="input-upload-image"
                  />
                </div>
                <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-1">Conseils:</p>
                  <ul className="space-y-1">
                    <li>• Utilisez des images PNG transparentes</li>
                    <li>• Résolution recommandée: 300 DPI</li>
                    <li>• Taille max: 2000x2000 pixels</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Size selection */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">Taille</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`min-w-[3rem] px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedSize === s ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                  data-testid={`button-designer-size-${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>

          {/* Add to cart */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Prix</span>
              <span className="text-xl font-bold text-primary">{product?.basePrice.toFixed(2)} $ CAD</span>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              data-testid="button-add-design-cart"
            >
              Ajouter mon design au panier
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Design enregistré et envoyé à l'impression à la commande
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
