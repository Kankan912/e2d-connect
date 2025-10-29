import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExportService } from '@/lib/exportService';

interface PrevisionData {
  mois: string;
  prevue: number;
  actuelle: number;
}

export default function CotisationsSimulation() {
  const [montantActuel, setMontantActuel] = useState(5000);
  const [nouveauMontant, setNouveauMontant] = useState(6000);
  const [nombreMembres, setNombreMembres] = useState(0);
  const [previsions, setPrevisions] = useState<PrevisionData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadMembresActifs();
  }, []);

  const loadMembresActifs = async () => {
    try {
      const { count, error } = await supabase
        .from('membres')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'actif');

      if (error) throw error;
      setNombreMembres(count || 0);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: "Erreur",
        description: "Erreur chargement membres: " + errorMessage,
        variant: "destructive"
      });
    }
  };

  const calculerImpact = () => {
    const impactMensuel = (nouveauMontant - montantActuel) * nombreMembres;
    const impactAnnuel = impactMensuel * 12;
    
    return { impactMensuel, impactAnnuel };
  };

  const genererPrevisions = () => {
    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = mois.map((mois, index) => ({
      mois,
      prevue: nouveauMontant * nombreMembres,
      actuelle: montantActuel * nombreMembres * (0.8 + Math.random() * 0.3) // Simulation avec variations
    }));
    
    setPrevisions(data);
  };

  const exporterSimulation = async () => {
    const { impactMensuel, impactAnnuel } = calculerImpact();
    
    await ExportService.export({
      format: 'pdf',
      title: 'Simulation Cotisations',
      data: previsions,
      columns: [
        { header: 'Mois', dataKey: 'mois' },
        { header: 'Prévue (FCFA)', dataKey: 'prevue' },
        { header: 'Actuelle (FCFA)', dataKey: 'actuelle' }
      ],
      metadata: {
        author: 'E2D',
        dateGeneration: new Date(),
        periode: new Date().getFullYear().toString(),
        association: 'Association E2D'
      },
      stats: [
        { label: 'Montant actuel', value: `${montantActuel} FCFA` },
        { label: 'Nouveau montant', value: `${nouveauMontant} FCFA` },
        { label: 'Impact mensuel', value: `+${impactMensuel.toLocaleString()} FCFA` },
        { label: 'Impact annuel', value: `+${impactAnnuel.toLocaleString()} FCFA` },
        { label: 'Nombre de membres', value: nombreMembres.toString() }
      ]
    });

    toast({
      title: "Succès",
      description: "Simulation exportée en PDF",
    });
  };

  const { impactMensuel, impactAnnuel } = calculerImpact();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulateur d'Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Montant actuel (FCFA)</Label>
              <Input
                type="number"
                value={montantActuel}
                onChange={(e) => setMontantActuel(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Nouveau montant (FCFA)</Label>
              <Input
                type="number"
                value={nouveauMontant}
                onChange={(e) => setNouveauMontant(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Nombre de membres</Label>
              <Input
                type="number"
                value={nombreMembres}
                onChange={(e) => setNombreMembres(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card className="bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Impact mensuel</p>
                <p className="text-2xl font-bold text-primary">
                  +{impactMensuel.toLocaleString()} FCFA
                </p>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Impact annuel</p>
                <p className="text-2xl font-bold text-success">
                  +{impactAnnuel.toLocaleString()} FCFA
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Prévisions sur 12 mois
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={genererPrevisions}>
                Générer Prévisions
              </Button>
              {previsions.length > 0 && (
                <Button variant="outline" onClick={exporterSimulation}>
                  Exporter PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {previsions.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={previsions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="prevue" stroke="hsl(var(--primary))" name="Prévue" />
                <Line type="monotone" dataKey="actuelle" stroke="hsl(var(--secondary))" name="Actuelle" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Cliquez sur "Générer Prévisions" pour voir le graphique
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
