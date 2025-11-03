import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoE2D from "@/assets/logo-e2d.png";

const Footer = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navigation = {
    main: [
      { label: "Accueil", onClick: () => scrollToSection("#hero") },
      { label: "À propos", onClick: () => scrollToSection("#about") },
      { label: "Activités", onClick: () => scrollToSection("#activities") },
      { label: "Événements", onClick: () => scrollToSection("#events") },
    ],
    resources: [
      { label: "Galerie", onClick: () => scrollToSection("#gallery") },
      { label: "Partenaires", onClick: () => scrollToSection("#partners") },
      { label: "Contact", onClick: () => scrollToSection("#contact") },
      { label: "Portail Membre", href: "/auth" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={logoE2D} alt="Logo E2D" className="h-12 w-auto" />
              <span className="text-xl font-bold">E2D Connect</span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Ensemble pour Demain - Association dédiée à l'entraide et au développement communautaire
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 hover:bg-gradient-to-br hover:from-primary hover:to-secondary rounded-full flex items-center justify-center transition-all"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xl font-bold mb-4">Navigation</h3>
            <ul className="space-y-2">
              {navigation.main.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={link.onClick}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xl font-bold mb-4">Ressources</h3>
            <ul className="space-y-2">
              {navigation.resources.map((link, index) => (
                <li key={index}>
                  {link.href ? (
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      onClick={link.onClick}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xl font-bold mb-4">Newsletter</h3>
            <p className="text-gray-400 mb-4">
              Restez informé de nos actualités et événements
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Votre email"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
              <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 shrink-0">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <a href="mailto:contact@e2d-connect.com" className="text-gray-400 hover:text-white transition-colors">
                contact@e2d-connect.com
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary" />
              <a href="tel:+33123456789" className="text-gray-400 hover:text-white transition-colors">
                +33 1 23 45 67 89
              </a>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-gray-400">123 Rue de l'Association, 75000 Paris</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-center md:text-left">
            © {new Date().getFullYear()} Association E2D Connect. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Mentions Légales
            </Link>
            <Link to="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
