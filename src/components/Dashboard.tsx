import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  CreditCard, 
  Trophy, 
  TrendingUp,
  Calendar,
  DollarSign,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalMembres: number;
  membresActifs: number;
  totalCotisations: number;
  adherentsPhoenix: number;
  cotisationsMois: number;
  tauxPresence: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembres: 0,
    membresActifs: 0,
    totalCotisations: 0,
    adherentsPhoenix: 0,
    cotisationsMois: 0,
    tauxPresence: 85
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Charger les statistiques des membres
      const { data: membres } = await supabase
        .from('membres')
        .select('*');
      
      const totalMembres = membres?.length || 0;
      const membresActifs = membres?.filter(m => m.statut === 'actif').length || 0;
      
      // Charger les cotisations
      const { data: cotisations } = await supabase
        .from('cotisations')
        .select('montant');
      
      const totalCotisations = cotisations?.reduce((sum, c) => sum + (c.montant || 0), 0) || 0;
      
      // Charger les adhérents Phoenix
      const { data: phoenix } = await supabase
        .from('phoenix_adherents')
        .select('*');
      
      const adherentsPhoenix = phoenix?.length || 0;
      
      // Cotisations de ce mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      
      const { data: cotisationsMois } = await supabase
        .from('cotisations')
        .select('montant')
        .gte('date_paiement', startOfMonth.toISOString().split('T')[0]);
      
      const totalCotisationsMois = cotisationsMois?.reduce((sum, c) => sum + (c.montant || 0), 0) || 0;
      
      setStats({
        totalMembres,
        membresActifs,
        totalCotisations,
        adherentsPhoenix,
        cotisationsMois: totalCotisationsMois,
        tauxPresence: 85 // Mock data pour le MVP
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    subtitle, 
    color = "primary" 
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: string;
    subtitle?: string;
    color?: "primary" | "secondary" | "accent" | "success";
  }) => (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-${color} to-${color}-light opacity-10 rounded-full -translate-y-6 translate-x-6`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 text-${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className="h-3 w-3 text-success mr-1" />
            <span className="text-xs text-success">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tableau de bord
          </h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de l'association E2D
          </p>
        </div>
        <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
          <Calendar className="w-3 h-3 mr-1" />
          {new Date().toLocaleDateString("fr-FR", { 
            year: 'numeric', 
            month: 'long' 
          })}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Membres"
          value={stats.totalMembres}
          icon={Users}
          subtitle={`${stats.membresActifs} actifs`}
          color="primary"
        />
        
        <StatCard
          title="Cotisations Totales"
          value={`${stats.totalCotisations.toLocaleString()} FCFA`}
          icon={DollarSign}
          trend="+12% ce mois"
          color="secondary"
        />
        
        <StatCard
          title="Sport Phoenix"
          value={stats.adherentsPhoenix}
          icon={Trophy}
          subtitle="adhérents actifs"
          color="accent"
        />
        
        <StatCard
          title="Cotisations Mois"
          value={`${stats.cotisationsMois.toLocaleString()} FCFA`}
          icon={CreditCard}
          color="success"
        />
      </div>

      {/* Detailed Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Membres actifs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Statut des Membres
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Membres actifs</span>
              <span className="text-sm text-muted-foreground">
                {stats.membresActifs}/{stats.totalMembres}
              </span>
            </div>
            <Progress 
              value={(stats.membresActifs / Math.max(stats.totalMembres, 1)) * 100} 
              className="h-2"
            />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taux de participation Sport</span>
              <span className="text-sm text-muted-foreground">{stats.tauxPresence}%</span>
            </div>
            <Progress value={stats.tauxPresence} className="h-2" />
          </CardContent>
        </Card>

        {/* Activités récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Activités Récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Réunion mensuelle</p>
                  <p className="text-xs text-muted-foreground">Prévue le 25/01/2025</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-warning rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Cotisations en retard</p>
                  <p className="text-xs text-muted-foreground">3 membres concernés</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Match Phoenix</p>
                  <p className="text-xs text-muted-foreground">Dimanche prochain</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      <Card className="border-warning/20 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertCircle className="h-5 w-5" />
            Rappels Importants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">• Réunion mensuelle prévue dans 5 jours</p>
            <p className="text-sm">• 3 membres ont des cotisations en retard</p>
            <p className="text-sm">• Mise à jour des statuts sportifs nécessaire</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}