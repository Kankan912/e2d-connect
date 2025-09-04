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
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LogoHeader from "@/components/LogoHeader";

export default function ConfigurationGenerale() {
  const [configurations, setConfigurations] = useState<Record<string, string>>({
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
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const saveAllConfigurations = async () => {
    setSaving(true);
    
    try {
      // Sauvegarde dans localStorage
      localStorage.setItem('app_configurations', JSON.stringify(configurations));
      
      toast({
        title: "Succès",
        description: "Configurations sauvegardées localement",
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

  const handleConfigChange = (cle: string, valeur: string) => {
    setConfigurations(prev => ({ ...prev, [cle]: valeur }));
  };

  useEffect(() => {
    // Charger depuis localStorage
    const saved = localStorage.getItem('app_configurations');
    if (saved) {
      try {
        setConfigurations(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (error) {
        console.error('Erreur chargement configurations locales:', error);
      }
    }
  }, []);

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