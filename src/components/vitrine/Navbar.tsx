import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logoE2D from "@/assets/logo-e2d.png";

const Navbar = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Accueil", href: "#hero" },
    { label: "À propos", href: "#about" },
    { label: "Activités", href: "#activities" },
    { label: "Événements", href: "#events" },
    { label: "Galerie", href: "#gallery" },
    { label: "Partenaires", href: "#partners" },
    { label: "Contact", href: "#contact" },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/site" className="flex items-center space-x-3 group">
            <img src={logoE2D} alt="Logo E2D" className="h-12 w-auto transition-transform group-hover:scale-105" />
            <span className={`text-xl font-bold transition-colors ${isScrolled ? "text-foreground" : "text-white"}`}>
              E2D Connect
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className={`px-4 py-2 rounded-lg font-medium transition-all hover:bg-primary/10 ${
                  isScrolled ? "text-foreground" : "text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate("/site/adhesion")}
              className={isScrolled ? "" : "border-white text-white hover:bg-white hover:text-primary"}
            >
              Adhérer
            </Button>
            <Button
              onClick={() => navigate("/site/don")}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Faire un don
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/portal")}
              className={isScrolled ? "" : "text-white hover:bg-white/10"}
            >
              Portail Membre
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className={isScrolled ? "" : "text-white hover:bg-white/10"}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className="text-left px-4 py-3 rounded-lg font-medium hover:bg-primary/10 transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="pt-4 space-y-3 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigate("/site/adhesion");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Adhérer
                  </Button>
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-secondary"
                    onClick={() => {
                      navigate("/site/don");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Faire un don
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      navigate("/portal");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Portail Membre
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
