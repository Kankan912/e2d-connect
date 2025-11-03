import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export const PublicFooter = () => {
  return (
    <footer className="w-full border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Association E2D Connect</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ensemble pour Demain - Une association dédiée à l'entraide et au développement communautaire.
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/site" className="text-muted-foreground hover:text-primary">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/site/a-propos" className="text-muted-foreground hover:text-primary">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/site/activites" className="text-muted-foreground hover:text-primary">
                  Nos Activités
                </Link>
              </li>
              <li>
                <Link to="/site/evenements" className="text-muted-foreground hover:text-primary">
                  Événements
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Ressources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/site/galerie" className="text-muted-foreground hover:text-primary">
                  Galerie Photos
                </Link>
              </li>
              <li>
                <Link to="/site/partenaires" className="text-muted-foreground hover:text-primary">
                  Nos Partenaires
                </Link>
              </li>
              <li>
                <Link to="/site/adhesion" className="text-muted-foreground hover:text-primary">
                  Devenir Membre
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-primary">
                  Portail Membre
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <a href="mailto:contact@e2d-connect.fr" className="text-muted-foreground hover:text-primary">
                  contact@e2d-connect.fr
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <a href="tel:+33123456789" className="text-muted-foreground hover:text-primary">
                  +33 1 23 45 67 89
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  123 Rue de la République<br />75001 Paris, France
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Association E2D Connect. Tous droits réservés.</p>
            <div className="flex gap-6">
              <Link to="/site/mentions-legales" className="hover:text-primary">
                Mentions Légales
              </Link>
              <Link to="/site/confidentialite" className="hover:text-primary">
                Confidentialité
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
