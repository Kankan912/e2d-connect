import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Percent } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MatchGalaConfig {
  id: string;
  nombre_matchs_minimum: number;
  pourcentage_presence_minimum: number;
  actif: boolean;
}

export default function MatchGalaConfig() {
  const [config, setConfig] = useState<MatchGalaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombre_matchs_minimum: '5',
    pourcentage_presence_minimum: '75',
    actif: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('match_gala_config')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setConfig(data as any);
        setFormData({
          nombre_matchs_minimum: data.nombre_matchs_minimum.toString(),
          pourcentage_presence_minimum: data.pourcentage_presence_minimum.toString(),
          actif: data.actif
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const configData = {
        nombre_matchs_minimum: parseInt(formData.nombre_matchs_minimum),
        pourcentage_presence_minimum: parseFloat(formData.pourcentage_presence_minimum),
        actif: formData.actif
      };

      const { error } = config
        ? await (supabase as any)
            .from('match_gala_config')
            .update(configData)
            .eq('id', config.id)
        : await (supabase as any)
            .from('match_gala_config')
            .insert([configData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Configuration du Match de Gala enregistrée avec succès",
      });

      loadConfig();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la configuration: " + error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Configuration Match de Gala
            {config && (
              <Badge variant={config.actif ? "default" : "secondary"}>
                {config.actif ? "Actif" : "Inactif"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_matchs_minimum">Nombre minimum de matchs</Label>
                <div className="relative">
                  <Target className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nombre_matchs_minimum"
                    type="number"
                    min="1"
                    placeholder="5"
                    className="pl-10"
                    value={formData.nombre_matchs_minimum}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre_matchs_minimum: e.target.value }))}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Nombre minimum de matchs joués pour être éligible
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pourcentage_presence_minimum">Pourcentage de présence minimum (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pourcentage_presence_minimum"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="75"
                    className="pl-10"
                    value={formData.pourcentage_presence_minimum}
                    onChange={(e) => setFormData(prev => ({ ...prev, pourcentage_presence_minimum: e.target.value }))}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Pourcentage de présence aux entraînements requis
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="actif"
                checked={formData.actif}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, actif: checked }))}
              />
              <Label htmlFor="actif">Activer les critères automatiques</Label>
            </div>
            
            <Button type="submit" className="w-full">
              Enregistrer la configuration
            </Button>
          </form>
          
          {config && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Critères actuels</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Minimum {config.nombre_matchs_minimum} matchs joués</p>
                <p>• Minimum {config.pourcentage_presence_minimum}% de présence aux entraînements</p>
                <p>• Statut: {config.actif ? "Actif" : "Inactif"}</p>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Les statistiques des joueurs seront automatiquement mises à jour selon ces critères.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}