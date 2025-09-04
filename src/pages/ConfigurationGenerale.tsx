import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  CreditCard, 
  Percent, 
  Calendar,
  Save
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEnsureAdmin } from "@/hooks/useEnsureAdmin";
import LogoHeader from "@/components/LogoHeader";

interface Configuration {
  cle: string;
  valeur: string;
  description: string;
}

export default function ConfigurationGenerale() {
  const [configurations, setConfigurations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { withEnsureAdmin } = useEnsureAdmin();

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('configurations')
        .select('*');

      if (error) throw error;

      const configsMap: Record<string, string> = {};
      (data || []).forEach(config => {
        configsMap[config.cle] = config.valeur;
      });

      // Valeurs par défaut
      const defaultConfigs = {
        taux_interet_pret: '5',
        duree_pret_mois: '2',
        montant_cotisation_huile: '1000',
        montant_cotisation_savon: '500',
        cotisation_huile_active: 'true',
        cotisation_savon_active: 'true',
        nom_organisation: 'Association E2D',
        email_organisation: 'contact@e2d.org',
        telephone_organisation: '+225 00 00 00 00',
        adresse_organisation: 'Abidjan, Côte d\'Ivoire'
      };

      setConfigurations({ ...defaultConfigs, ...configsMap });
    } catch (error: any) {
      console.error('Erreur chargement configurations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (cle: string, valeur: string) => {
    const operation = async () => {
      const { error } = await supabase
        .from('configurations')
        .upsert([{ 
          cle, 
          valeur, 
          description: getConfigDescription(cle) 
        }]);

      if (error) throw error;
    };

    try {
      await withEnsureAdmin(operation);
      
      setConfigurations(prev => ({ ...prev, [cle]: valeur }));
      
      toast({
        title: "Succès",
        description: "Configuration mise à jour",
      });
    } catch (error: any) {
      console.error('Erreur sauvegarde configuration:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive",
      });
    }
  };

  const saveAllConfigurations = async () => {
    setSaving(true);
    
    const operation = async () => {
      const configsToSave = Object.entries(configurations).map(([cle, valeur]) => ({
        cle,
        valeur,
        description: getConfigDescription(cle)
      }));

      const { error } = await supabase
        .from('configurations')
        .upsert(configsToSave);

      if (error) throw error;
    };

    try {
      await withEnsureAdmin(operation);
      
      toast({
        title: "Succès",
        description: "Toutes les configurations ont été sauvegardées",
      });
    } catch (error: any) {
      console.error('Erreur sauvegarde configurations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les configurations",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getConfigDescription = (cle: string): string => {
    const descriptions: Record<string, string> = {
      taux_interet_pret: "Taux d'intérêt fixe appliqué aux prêts",
      duree_pret_mois: "Durée par défaut d'un prêt en mois",
      montant_cotisation_huile: "Montant par défaut pour la cotisation huile",
      montant_cotisation_savon: "Montant par défaut pour la cotisation savon",
      cotisation_huile_active: "Activation de la cotisation huile",
      cotisation_savon_active: "Activation de la cotisation savon",
      nom_organisation: "Nom officiel de l'organisation",
      email_organisation: "Email de contact principal",
      telephone_organisation: "Numéro de téléphone principal",
      adresse_organisation: "Adresse physique de l'organisation"
    };
    return descriptions[cle] || "Configuration système";
  };

  const handleConfigChange = (cle: string, valeur: string) => {
    setConfigurations(prev => ({ ...prev, [cle]: valeur }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <LogoHeader 
          title="Configuration Générale"
          subtitle="Paramètres globaux de l'application"
        />
        <Button 
          onClick={saveAllConfigurations}
          disabled={saving}
          className="bg-gradient-to-r from-primary to-secondary"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder tout'}
        </Button>
      </div>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financial">Paramètres Financiers</TabsTrigger>
          <TabsTrigger value="cotisations">Cotisations</TabsTrigger>
          <TabsTrigger value="organization">Organisation</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Paramètres des Prêts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taux-interet">Taux d'intérêt fixe (%)</Label>
                  <Input
                    id="taux-interet"
                    type="number"
                    step="0.1"
                    value={configurations.taux_interet_pret || '5'}
                    onChange={(e) => handleConfigChange('taux_interet_pret', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Taux appliqué automatiquement à tous les nouveaux prêts
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duree-pret">Durée par défaut (mois)</Label>
                  <Input
                    id="duree-pret"
                    type="number"
                    value={configurations.duree_pret_mois || '2'}
                    onChange={(e) => handleConfigChange('duree_pret_mois', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Durée utilisée pour calculer l'échéance automatiquement
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cotisations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Configuration des Cotisations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Cotisation Huile</h4>
                    <p className="text-sm text-muted-foreground">
                      Cotisation sous forme de checkbox pour tous les membres
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <Input
                        type="number"
                        className="w-24"
                        value={configurations.montant_cotisation_huile || '1000'}
                        onChange={(e) => handleConfigChange('montant_cotisation_huile', e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground">FCFA</span>
                    </div>
                    <Switch
                      checked={configurations.cotisation_huile_active === 'true'}
                      onCheckedChange={(checked) => 
                        handleConfigChange('cotisation_huile_active', checked ? 'true' : 'false')
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Cotisation Savon</h4>
                    <p className="text-sm text-muted-foreground">
                      Cotisation sous forme de checkbox pour tous les membres
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <Input
                        type="number"
                        className="w-24"
                        value={configurations.montant_cotisation_savon || '500'}
                        onChange={(e) => handleConfigChange('montant_cotisation_savon', e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground">FCFA</span>
                    </div>
                    <Switch
                      checked={configurations.cotisation_savon_active === 'true'}
                      onCheckedChange={(checked) => 
                        handleConfigChange('cotisation_savon_active', checked ? 'true' : 'false')
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Informations de l'Organisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom-org">Nom de l'organisation</Label>
                  <Input
                    id="nom-org"
                    value={configurations.nom_organisation || ''}
                    onChange={(e) => handleConfigChange('nom_organisation', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-org">Email de contact</Label>
                  <Input
                    id="email-org"
                    type="email"
                    value={configurations.email_organisation || ''}
                    onChange={(e) => handleConfigChange('email_organisation', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tel-org">Téléphone</Label>
                  <Input
                    id="tel-org"
                    value={configurations.telephone_organisation || ''}
                    onChange={(e) => handleConfigChange('telephone_organisation', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adresse-org">Adresse</Label>
                  <Input
                    id="adresse-org"
                    value={configurations.adresse_organisation || ''}
                    onChange={(e) => handleConfigChange('adresse_organisation', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}