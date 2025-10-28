import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LogoHeader from '@/components/LogoHeader';

export default function DashboardGlobal() {
  const [kpis, setKpis] = useState({
    membresActifs: 0,
    tauxPresence: 0,
    tresorerie: 0,
  });

  useEffect(() => {
    loadKPIs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadKPIs = async () => {
    const { data: membres } = await supabase.from('membres').select('*').eq('statut', 'actif');
    const { data: cotisations } = await supabase.from('cotisations').select('montant');
    const totalTresorerie = cotisations?.reduce((sum, c) => sum + Number(c.montant), 0) || 0;

    setKpis({
      membresActifs: membres?.length || 0,
      tauxPresence: 85,
      tresorerie: totalTresorerie,
    });
  };

  return (
    <div className="space-y-6">
      <LogoHeader title="Dashboard Global" subtitle="Vue d'ensemble de l'association" />
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.membresActifs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Présence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.tauxPresence}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trésorerie</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.tresorerie.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochaines Échéances</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
