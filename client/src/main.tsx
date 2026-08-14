import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initPixel } from "@/lib/analytics";

if (!window.location.hash) {
  window.location.hash = "#/";
}

// Pixel Meta — ne se charge que si VITE_FB_PIXEL_ID est defini au build
initPixel();

createRoot(document.getElementById("root")!).render(<App />);
