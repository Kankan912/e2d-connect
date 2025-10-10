import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function TableauBordJauneRouge() {
  const currentYear = new Date().getFullYear();

  const { data: stats } = useQuery({
    queryKey: ['phoenix-stats-jaune-rouge', currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phoenix_stats_jaune_rouge')
        .select('*')
        .eq('annee', currentYear)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      return data || {
        annee: currentYear,
        victoires_jaune: 0,
        victoires_rouge: 0,
        matchs_nuls: 0,
        buts_jaune: 0,
        buts_rouge: 0,
        cartons_jaunes_jaune: 0,
        cartons_jaunes_rouge: 0,
        cartons_rouges_jaune: 0,
        cartons_rouges_rouge: 0,
      };
    }
  });

  const { data: historique } = useQuery({
    queryKey: ['phoenix-entrainements-internes-historique'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phoenix_entrainements_internes')
        .select('*')
        .eq('statut', 'termine')
        .order('date_entrainement', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  if (!stats) return <div>Chargement...</div>;

  const totalMatchs = stats.victoires_jaune + stats.victoires_rouge + stats.matchs_nuls;

  const victoiresData = [
    { name: 'Équipe Jaune', value: stats.victoires_jaune, color: '#FCD34D' },
    { name: 'Équipe Rouge', value: stats.victoires_rouge, color: '#EF4444' },
    { name: 'Matchs Nuls', value: stats.matchs_nuls, color: '#9CA3AF' },
  ];

  const butsData = [
    { name: 'Équipe Jaune', buts: stats.buts_jaune },
    { name: 'Équipe Rouge', buts: stats.buts_rouge },
  ];

  const cartonsData = [
    { 
      name: 'Jaune', 
      'Cartons Jaunes': stats.cartons_jaunes_jaune, 
      'Cartons Rouges': stats.cartons_rouges_jaune 
    },
    { 
      name: 'Rouge', 
      'Cartons Jaunes': stats.cartons_jaunes_rouge, 
      'Cartons Rouges': stats.cartons_rouges_rouge 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tableau de Bord Jaune vs Rouge {currentYear}</h2>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matchs</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMatchs}</div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Victoires Jaune</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              {stats.victoires_jaune}
            </div>
            <p className="text-xs text-muted-foreground">{stats.buts_jaune} buts marqués</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Victoires Rouge</CardTitle>
            <Trophy className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {stats.victoires_rouge}
            </div>
            <p className="text-xs text-muted-foreground">{stats.buts_rouge} buts marqués</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Graphique victoires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Répartition des victoires
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalMatchs > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={victoiresData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {victoiresData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Aucun match enregistré
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graphique buts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Buts marqués
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={butsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="buts" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique cartons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Cartons distribués
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cartonsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Cartons Jaunes" fill="#FCD34D" />
                <Bar dataKey="Cartons Rouges" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Historique des matchs */}
        <Card>
          <CardHeader>
            <CardTitle>Derniers matchs internes</CardTitle>
          </CardHeader>
          <CardContent>
            {historique && historique.length > 0 ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {historique.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(match.date_entrainement).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{match.lieu || 'Lieu non précisé'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        <span className="text-yellow-600">{match.score_jaune}</span>
                        {' - '}
                        <span className="text-red-600">{match.score_rouge}</span>
                      </p>
                      {match.equipe_gagnante && (
                        <p className={`text-xs ${
                          match.equipe_gagnante === 'jaune' ? 'text-yellow-600' : 
                          match.equipe_gagnante === 'rouge' ? 'text-red-600' : 
                          'text-muted-foreground'
                        }`}>
                          {match.equipe_gagnante === 'nul' ? 'Match nul' : `Victoire ${match.equipe_gagnante}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Aucun historique disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
