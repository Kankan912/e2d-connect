import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const PublicHeader = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Accueil", href: "/site" },
    { name: "À propos", href: "/site/a-propos" },
    { name: "Activités", href: "/site/activites" },
    { name: "Événements", href: "/site/evenements" },
    { name: "Galerie", href: "/site/galerie" },
    { name: "Partenaires", href: "/site/partenaires" },
    { name: "Contact", href: "/site/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Title */}
          <Link to="/site" className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/c1efd290-dcb8-44ad-bd52-81f65f2cb640.png" 
              alt="E2D Logo" 
              className="h-12 w-auto"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-primary">
                Association E2D
              </h1>
              <p className="text-xs text-muted-foreground">
                Ensemble pour Demain
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
            
            <Link to="/auth">
              <Button variant="default" className="ml-4">
                <LogIn className="mr-2 h-4 w-4" />
                Portail Membre
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu */}
          <div className="flex lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium transition-colors hover:text-primary"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button variant="default" className="w-full mt-4">
                      <LogIn className="mr-2 h-4 w-4" />
                      Portail Membre
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
