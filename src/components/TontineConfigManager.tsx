import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, DollarSign, PiggyBank, TrendingUp, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TontineConfig {
  id: string;
  cle: string;
  valeur: string;
  type_valeur: 'montant' | 'pourcentage' | 'booleen' | 'texte';
  categorie: 'cotisations' | 'investissements' | 'regles' | 'epargnes';
  description?: string;
}

export default function TontineConfigManager() {
  const [configs, setConfigs] = useState<TontineConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('tontine_configurations')
        .select('*')
        .order('categorie', { ascending: true });

      if (error) throw error;
      setConfigs((data || []) as TontineConfig[]);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (configId: string, newValue: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tontine_configurations')
        .update({ valeur: newValue })
        .eq('id', configId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Configuration mise à jour",
      });

      fetchConfigs();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderConfigInput = (config: TontineConfig) => {
    const handleChange = (value: string) => {
      setConfigs(prev => 
        prev.map(c => c.id === config.id ? { ...c, valeur: value } : c)
      );
    };

    switch (config.type_valeur) {
      case 'montant':
      case 'pourcentage':
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              value={config.valeur}
              onChange={(e) => handleChange(e.target.value)}
              className="flex-1"
            />
            <span className="flex items-center px-3 text-muted-foreground">
              {config.type_valeur === 'montant' ? 'FCFA' : '%'}
            </span>
          </div>
        );
      case 'booleen':
        return (
          <Select value={config.valeur} onValueChange={handleChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Oui</SelectItem>
              <SelectItem value="false">Non</SelectItem>
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            value={config.valeur}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
    }
  };

  const getCategoryIcon = (categorie: string) => {
    switch (categorie) {
      case 'cotisations': return DollarSign;
      case 'investissements': return TrendingUp;
      case 'epargnes': return PiggyBank;
      default: return Settings;
    }
  };

  const configsByCategory = configs.reduce((acc, config) => {
    if (!acc[config.categorie]) acc[config.categorie] = [];
    acc[config.categorie].push(config);
    return acc;
  }, {} as Record<string, TontineConfig[]>);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Tontine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cotisations" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cotisations">
                <DollarSign className="w-4 h-4 mr-2" />
                Cotisations
              </TabsTrigger>
              <TabsTrigger value="investissements">
                <TrendingUp className="w-4 h-4 mr-2" />
                Investissements
              </TabsTrigger>
              <TabsTrigger value="epargnes">
                <PiggyBank className="w-4 h-4 mr-2" />
                Épargnes
              </TabsTrigger>
              <TabsTrigger value="regles">
                <Settings className="w-4 h-4 mr-2" />
                Règles
              </TabsTrigger>
            </TabsList>

            {Object.entries(configsByCategory).map(([categorie, categoryConfigs]) => (
              <TabsContent key={categorie} value={categorie} className="space-y-4">
                {categoryConfigs.map((config) => {
                  const Icon = getCategoryIcon(config.categorie);
                  return (
                    <Card key={config.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {config.cle.split('_').map(w => 
                                w.charAt(0).toUpperCase() + w.slice(1)
                              ).join(' ')}
                            </CardTitle>
                            {config.description && (
                              <p className="text-sm text-muted-foreground">
                                {config.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">{config.type_valeur}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            {renderConfigInput(config)}
                          </div>
                          <Button
                            onClick={() => handleSaveConfig(config.id, config.valeur)}
                            disabled={saving}
                            size="sm"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Sauvegarder
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Section pour ajouter de nouvelles configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ajouter une nouvelle configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Pour ajouter de nouvelles configurations, contactez l'administrateur système.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
