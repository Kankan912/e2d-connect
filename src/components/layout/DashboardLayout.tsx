import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Home, User, DollarSign, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, userRole, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const memberLinks = [
    { href: "/dashboard", label: "Accueil", icon: Home },
    { href: "/dashboard/profile", label: "Mon Profil", icon: User },
    { href: "/dashboard/my-donations", label: "Mes Dons", icon: DollarSign },
    { href: "/dashboard/my-cotisations", label: "Mes Cotisations", icon: CreditCard },
  ];

  const adminLinks = [
    { href: "/dashboard/admin/donations", label: "Gestion Dons", icon: DollarSign },
    { href: "/dashboard/admin/adhesions", label: "Adhésions", icon: User },
    { href: "/dashboard/admin/site", label: "CMS Site", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/site" className="flex items-center gap-2">
              <img src="/lovable-uploads/c1efd290-dcb8-44ad-bd52-81f65f2cb640.png" alt="E2D" className="h-10" />
              <span className="font-bold text-xl">E2D Connect</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {user?.email}
              {userRole && <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">{userRole}</span>}
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="container flex gap-6 py-6">
        {/* Sidebar */}
        <aside className="w-64 shrink-0">
          <nav className="space-y-2">
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase">Espace Membre</p>
              {memberLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} to={link.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        location.pathname === link.href && "bg-accent"
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {isAdmin && (
              <div className="space-y-1 pt-4 border-t">
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase">Administration</p>
                {adminLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.href} to={link.href}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start",
                          location.pathname.startsWith(link.href) && "bg-accent"
                        )}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {link.label}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
