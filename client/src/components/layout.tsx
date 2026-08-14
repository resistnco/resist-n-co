import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/cart";
import { useTheme } from "@/lib/theme";
import { Logo, SunIcon, MoonIcon, CartIcon } from "./icons";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Navbar() {
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Collection" },
    { href: "/designer", label: "Créer mon design" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-display font-bold uppercase tracking-wide">
            <Logo className="w-10 h-10" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-accent hover:text-accent-foreground uppercase tracking-wide ${
                  location === link.href ? "text-primary" : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Changer le thème"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </Button>

            <Link href="/panier">
              <Button variant="ghost" size="icon" aria-label="Panier" data-testid="button-cart">
                <CartIcon count={totalItems} />
              </Button>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden flex flex-col gap-1 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-accent uppercase tracking-wide ${
                  location === link.href ? "text-primary" : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-display font-bold mb-3 uppercase tracking-wide">
              <Logo className="w-8 h-8" />
            </div>
            <p className="text-sm text-muted-foreground">
              Vêtements et accessoires aux logos engagés. Résistez, organisez-vous, habillez vos convictions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 uppercase tracking-wide">Collection</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary">Tous les produits</Link></li>
              <li><Link href="/designer" className="hover:text-primary">Créer un design</Link></li>
              <li><Link href="/panier" className="hover:text-primary">Mon panier</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 uppercase tracking-wide">Légal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/legal/confidentialite" className="hover:text-primary">Politique de confidentialité</Link></li>
              <li><Link href="/legal/conditions" className="hover:text-primary">Conditions d'utilisation</Link></li>
              <li><Link href="/legal/expedition" className="hover:text-primary">Expédition & livraison</Link></li>
              <li><Link href="/legal/retours" className="hover:text-primary">Retours & remboursements</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 uppercase tracking-wide">Nos valeurs</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Coton biologique éthique</li>
              <li>Impression à la demande</li>
              <li>Livraison Canada 5-10 jours</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Resist N Co. Pas de planète B.
        </div>
      </div>
    </footer>
  );
}
