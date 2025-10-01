import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Banknote, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Calculator,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

interface PretStats {
  totalPrets: number;
  totalEnCours: number;
  totalPaye: number;
  totalEnRetard: number;
  totalInterets: number;
  nombrePrets: number;
  nombreEnCours: number;
  nombreRembourses: number;
  nombreEnRetard: number;
}

export default function TableauBordPrets() {
  const [stats, setStats] = useState<PretStats>({
    totalPrets: 0,
    totalEnCours: 0,
    totalPaye: 0,
    totalEnRetard: 0,
    totalInterets: 0,
    nombrePrets: 0,
    nombreEnCours: 0,
    nombreRembourses: 0,
    nombreEnRetard: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadStatsPrets = async () => {
    try {
      const { data: prets, error } = await supabase
        .from('prets')
        .select('*');

      if (error) throw error;

      const now = new Date();
      let totalPrets = 0;
      let totalEnCours = 0;
      let totalPaye = 0;
      let totalEnRetard = 0;
      let totalInterets = 0;
      let nombreEnCours = 0;
      let nombreRembourses = 0;
      let nombreEnRetard = 0;

      prets?.forEach(pret => {
        const montantTotal = pret.montant + (pret.montant * pret.taux_interet / 100 * (1 + (pret.reconductions || 0)));
        const interets = montantTotal - pret.montant;
        const montantPaye = pret.montant_paye || 0;
        const isEnRetard = new Date(pret.echeance) < now && pret.statut !== 'rembourse';

        totalPrets += montantTotal;
        totalInterets += interets;

        if (pret.statut === 'rembourse') {
          totalPaye += montantTotal;
          nombreRembourses++;
        } else if (isEnRetard) {
          totalEnRetard += (montantTotal - montantPaye);
          nombreEnRetard++;
        } else {
          totalEnCours += (montantTotal - montantPaye);
          nombreEnCours++;
        }
      });

      setStats({
        totalPrets,
        totalEnCours,
        totalPaye,
        totalEnRetard,
        totalInterets,
        nombrePrets: prets?.length || 0,
        nombreEnCours,
        nombreRembourses,
        nombreEnRetard
      });

    } catch (error: any) {
      console.error('Erreur chargement stats prêts:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques des prêts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatsPrets();
  }, []);

  // Synchronisation temps réel des prêts
  useRealtimeUpdates({
    table: 'prets',
    onUpdate: loadStatsPrets,
    enabled: true
  });

  useRealtimeUpdates({
    table: 'prets_paiements',
    onUpdate: loadStatsPrets,
    enabled: true
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Indicateurs Financiers Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prêts</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrets.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">
              Montant total avec intérêts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total En Cours</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.totalEnCours.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">
              {stats.nombreEnCours} prêt(s) actif(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payé</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.totalPaye.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">
              {stats.nombreRembourses} prêt(s) remboursé(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total En Retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.totalEnRetard.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">
              {stats.nombreEnRetard} prêt(s) en retard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Indicateurs Complémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intérêts Totaux</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalInterets.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">
              Revenus générés par les prêts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nombre Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nombrePrets}</div>
            <p className="text-xs text-muted-foreground">
              Prêts accordés au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Recouvrement</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalPrets > 0 ? ((stats.totalPaye / stats.totalPrets) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Montant remboursé / Total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Résumé Visuel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Vue d'Ensemble
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="h-8 w-8 rounded-full flex items-center justify-center">
                  <Banknote className="h-4 w-4" />
                </Badge>
                <div>
                  <p className="font-medium">Capital + Intérêts</p>
                  <p className="text-sm text-muted-foreground">Montant total engagé</p>
                </div>
              </div>
              <p className="text-xl font-bold">{stats.totalPrets.toLocaleString()} FCFA</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Remboursés</span>
                </div>
                <p className="text-lg font-bold text-green-700">{stats.totalPaye.toLocaleString()}</p>
              </div>

              <div className="flex flex-col p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">En cours</span>
                </div>
                <p className="text-lg font-bold text-yellow-700">{stats.totalEnCours.toLocaleString()}</p>
              </div>

              <div className="flex flex-col p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">En retard</span>
                </div>
                <p className="text-lg font-bold text-red-700">{stats.totalEnRetard.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}