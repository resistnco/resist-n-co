import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/cart";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { Logo, SunIcon, MoonIcon, CartIcon } from "./icons";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Navbar() {
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t("nav.collection") },
    { href: "/designer", label: t("nav.designer") },
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
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
              aria-label={lang === "fr" ? "Switch to English" : "Passer au français"}
              data-testid="button-language-toggle"
            >
              <span className={lang === "fr" ? "text-primary" : "text-muted-foreground"}>FR</span>
              <span className="text-muted-foreground/40">|</span>
              <span className={lang === "en" ? "text-primary" : "text-muted-foreground"}>EN</span>
            </button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={t("nav.theme")}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </Button>

            <Link href="/panier">
              <Button variant="ghost" size="icon" aria-label={t("nav.cart")} data-testid="button-cart">
                <CartIcon count={totalItems} />
              </Button>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={t("nav.menu")}
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
  const { t } = useI18n();
  return (
    <footer className="border-t border-border mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-display font-bold mb-3 uppercase tracking-wide">
              <Logo className="w-8 h-8" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 uppercase tracking-wide">{t("footer.collection")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary">{t("footer.allProducts")}</Link></li>
              <li><Link href="/designer" className="hover:text-primary">{t("footer.createDesign")}</Link></li>
              <li><Link href="/panier" className="hover:text-primary">{t("footer.myCart")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 uppercase tracking-wide">{t("footer.help")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/faq" className="hover:text-primary">{t("footer.faq")}</Link></li>
              <li><Link href="/contact" className="hover:text-primary">{t("footer.contact")}</Link></li>
              <li><Link href="/legal/retours" className="hover:text-primary">{t("footer.reportDefect")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 uppercase tracking-wide">{t("footer.legal")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/legal/confidentialite" className="hover:text-primary">{t("footer.privacy")}</Link></li>
              <li><Link href="/legal/conditions" className="hover:text-primary">{t("footer.terms")}</Link></li>
              <li><Link href="/legal/expedition" className="hover:text-primary">{t("footer.shipping")}</Link></li>
              <li><Link href="/legal/retours" className="hover:text-primary">{t("footer.returns")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 uppercase tracking-wide">{t("footer.values")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{t("footer.organicCotton")}</li>
              <li>{t("footer.printOnDemand")}</li>
              <li>{t("footer.deliveryCanada")}</li>
              <li>{t("footer.defectReplaced")}</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Resist N Co. {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
