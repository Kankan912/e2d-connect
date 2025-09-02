
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CreditCard, 
  Trophy, 
  FileText, 
  Settings, 
  LogOut,
  Home,
  Menu,
  X,
  Banknote,
  PiggyBank,
  HandHeart,
  AlertTriangle,
  Calendar,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logoE2D from "@/assets/logo-e2d.png";

interface LayoutProps {
  children: React.ReactNode;
  user: any;
}

const menuItems = [
  { id: "dashboard", label: "Tableau de bord", icon: Home, path: "/" },
  { id: "membres", label: "Membres E2D", icon: Users, path: "/membres" },
  { id: "cotisations", label: "Cotisations", icon: CreditCard, path: "/cotisations" },
  { id: "prets", label: "Prêts", icon: Banknote, path: "/prets" },
  { id: "epargnes", label: "Épargnes", icon: PiggyBank, path: "/epargnes" },
  { id: "aides", label: "Aides", icon: HandHeart, path: "/aides" },
  { id: "sanctions", label: "Sanctions", icon: AlertTriangle, path: "/sanctions" },
  { id: "reunions", label: "Réunions", icon: Calendar, path: "/reunions" },
  { id: "sport-phoenix", label: "Sport Phoenix", icon: Trophy, path: "/sport-phoenix" },
  { id: "sport-e2d", label: "Sport E2D", icon: Activity, path: "/sport-e2d" },
  { id: "calendrier", label: "Calendrier Sportif", icon: Calendar, path: "/calendrier-sportif" },
  { id: "presences", label: "Présences", icon: Users, path: "/gestion-presences" },
  { id: "match-results", label: "Résultats Matchs", icon: Trophy, path: "/match-results" },
  { id: "historique", label: "Historique Connexions", icon: FileText, path: "/historique-connexion" },
  { id: "eligibilite", label: "Éligibilité Gala", icon: Trophy, path: "/eligibilite-gala" },
  { id: "rapports", label: "Rapports", icon: FileText, path: "/rapports" },
  { id: "configuration", label: "Configuration", icon: Settings, path: "/configuration" },
];

export default function Layout({ children, user }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Ignorer les erreurs 403/Session not found et naviguer quand même
      console.warn('Logout error (ignored):', error);
    } finally {
      navigate("/auth");
      toast({
        title: "Déconnexion",
        description: "À bientôt !",
      });
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
            
            <div className="flex items-center gap-3">
              <img 
                src={logoE2D} 
                alt="Logo E2D" 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div 
                className="h-10 w-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ display: 'none' }}
              >
                E2D
              </div>
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  E2D Connect
                </h1>
                <p className="text-xs text-muted-foreground">Gestion Association</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.email}</p>
                <Badge variant="secondary" className="text-xs">
                  Membre actif
                </Badge>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={16} />
              <span className="hidden sm:inline ml-2">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card/80 backdrop-blur-sm border-r border-border/50 transition-transform duration-300 ease-in-out`}>
          
          <nav className="p-4 space-y-2 mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 h-12 ${
                    isActive 
                      ? "bg-gradient-to-r from-primary via-primary to-primary-light text-white shadow-lg" 
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon size={18} />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <Card className="p-3 bg-gradient-to-br from-info to-info/20 border-primary/20">
              <div className="flex items-center gap-2">
                <img 
                  src={logoE2D} 
                  alt="Logo E2D" 
                  className="h-4 w-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div 
                  className="h-4 w-4 bg-gradient-to-br from-primary to-secondary rounded text-white flex items-center justify-center font-bold text-xs"
                  style={{ display: 'none' }}
                >
                  E2D
                </div>
                <div>
                  <p className="text-xs font-medium text-primary">Version 1.0</p>
                  <p className="text-xs text-muted-foreground">MVP E2D Connect</p>
                </div>
              </div>
            </Card>
          </div>
        </aside>

        {/* Overlay pour mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-30 lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-6 lg:ml-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
