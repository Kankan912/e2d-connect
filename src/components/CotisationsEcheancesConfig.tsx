import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CotisationsEcheancesConfig() {
  const [config, setConfig] = useState({
    date_limite_mensuelle: 5,
    date_limite_annuelle: '12-31',
    rappel_j7_actif: true,
    rappel_j3_actif: true,
    rappel_j1_actif: true
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configurations')
        .select('*')
        .in('cle', ['date_limite_mensuelle', 'date_limite_annuelle', 'rappel_j7', 'rappel_j3', 'rappel_j1']);

      if (error) throw error;

      const configMap: any = {};
      data?.forEach(item => {
        configMap[item.cle] = item.valeur;
      });

      setConfig({
        date_limite_mensuelle: parseInt(configMap.date_limite_mensuelle || '5'),
        date_limite_annuelle: configMap.date_limite_annuelle || '12-31',
        rappel_j7_actif: configMap.rappel_j7 === 'true',
        rappel_j3_actif: configMap.rappel_j3 === 'true',
        rappel_j1_actif: configMap.rappel_j1 === 'true'
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('configurations')
        .upsert({ cle: key, valeur: value }, { onConflict: 'cle' });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Configuration enregistrée",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Échéances
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Date limite mensuelle (jour du mois)</Label>
            <Input
              type="number"
              min="1"
              max="31"
              value={config.date_limite_mensuelle}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setConfig({ ...config, date_limite_mensuelle: val });
                saveConfig('date_limite_mensuelle', val.toString());
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Par défaut le {config.date_limite_mensuelle} de chaque mois
            </p>
          </div>
          <div>
            <Label>Date limite annuelle (MM-JJ)</Label>
            <Input
              type="text"
              placeholder="12-31"
              value={config.date_limite_annuelle}
              onChange={(e) => {
                setConfig({ ...config, date_limite_annuelle: e.target.value });
                saveConfig('date_limite_annuelle', e.target.value);
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: Mois-Jour (ex: 12-31 pour 31 décembre)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Rappels Automatiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Rappel J-7</Label>
              <p className="text-xs text-muted-foreground">7 jours avant l'échéance</p>
            </div>
            <Switch
              checked={config.rappel_j7_actif}
              onCheckedChange={(checked) => {
                setConfig({ ...config, rappel_j7_actif: checked });
                saveConfig('rappel_j7', checked.toString());
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Rappel J-3</Label>
              <p className="text-xs text-muted-foreground">3 jours avant l'échéance</p>
            </div>
            <Switch
              checked={config.rappel_j3_actif}
              onCheckedChange={(checked) => {
                setConfig({ ...config, rappel_j3_actif: checked });
                saveConfig('rappel_j3', checked.toString());
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Rappel J-1</Label>
              <p className="text-xs text-muted-foreground">Veille de l'échéance</p>
            </div>
            <Switch
              checked={config.rappel_j1_actif}
              onCheckedChange={(checked) => {
                setConfig({ ...config, rappel_j1_actif: checked });
                saveConfig('rappel_j1', checked.toString());
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
