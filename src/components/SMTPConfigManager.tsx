import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Mail, Server, Key, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SMTPConfig {
  id: string;
  serveur_smtp: string;
  port_smtp: number;
  utilisateur_smtp: string;
  mot_de_passe_smtp: string;
  encryption_type: string;
  actif: boolean;
}

export default function SMTPConfigManager() {
  const [config, setConfig] = useState<SMTPConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    serveur_smtp: '',
    port_smtp: '587',
    utilisateur_smtp: '',
    mot_de_passe_smtp: '',
    encryption_type: 'TLS',
    actif: false,
    email_test: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('smtp_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setConfig(data);
        setFormData({
          serveur_smtp: data.serveur_smtp,
          port_smtp: data.port_smtp.toString(),
          utilisateur_smtp: data.utilisateur_smtp,
          mot_de_passe_smtp: data.mot_de_passe_smtp,
          encryption_type: data.encryption_type,
          actif: data.actif,
          email_test: ''
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration SMTP: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serveur_smtp || !formData.utilisateur_smtp || !formData.mot_de_passe_smtp) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const configData = {
        serveur_smtp: formData.serveur_smtp,
        port_smtp: parseInt(formData.port_smtp),
        utilisateur_smtp: formData.utilisateur_smtp,
        mot_de_passe_smtp: formData.mot_de_passe_smtp,
        encryption_type: formData.encryption_type,
        actif: formData.actif
      };

      const { error } = config
        ? await supabase
            .from('smtp_config')
            .update(configData)
            .eq('id', config.id)
        : await supabase
            .from('smtp_config')
            .insert([configData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Configuration SMTP enregistrée avec succès",
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

  const testConnection = async () => {
    if (!formData.serveur_smtp || !formData.utilisateur_smtp || !formData.mot_de_passe_smtp) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs avant de tester",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('test-smtp-config', {
        body: {
          serveur_smtp: formData.serveur_smtp,
          port_smtp: parseInt(formData.port_smtp),
          utilisateur_smtp: formData.utilisateur_smtp,
          mot_de_passe_smtp: formData.mot_de_passe_smtp,
          encryption_type: formData.encryption_type,
          email_test: formData.email_test || formData.utilisateur_smtp
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Succès",
          description: "Connexion SMTP testée avec succès",
        });
      } else {
        throw new Error(data.error || 'Test échoué');
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Test de connexion échoué: " + error.message,
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
            <Server className="h-5 w-5" />
            Configuration SMTP
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
                <Label htmlFor="serveur_smtp">Serveur SMTP *</Label>
                <div className="relative">
                  <Server className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="serveur_smtp"
                    placeholder="smtp.gmail.com"
                    className="pl-10"
                    value={formData.serveur_smtp}
                    onChange={(e) => setFormData(prev => ({ ...prev, serveur_smtp: e.target.value.trim() }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="port_smtp">Port</Label>
                <Input
                  id="port_smtp"
                  type="number"
                  placeholder="587"
                  value={formData.port_smtp}
                  onChange={(e) => setFormData(prev => ({ ...prev, port_smtp: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="utilisateur_smtp">Nom d'utilisateur *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="utilisateur_smtp"
                    placeholder="votre-email@gmail.com"
                    className="pl-10"
                    value={formData.utilisateur_smtp}
                    onChange={(e) => setFormData(prev => ({ ...prev, utilisateur_smtp: e.target.value.trim() }))}
                    required
                  />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mot_de_passe_smtp">Mot de passe *</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mot_de_passe_smtp"
                  type="password"
                  placeholder="Mot de passe ou token d'application"
                  className="pl-10"
                  value={formData.mot_de_passe_smtp}
                  onChange={(e) => setFormData(prev => ({ ...prev, mot_de_passe_smtp: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="encryption_type">Type de chiffrement</Label>
              <Select value={formData.encryption_type} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, encryption_type: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TLS">TLS</SelectItem>
                  <SelectItem value="SSL">SSL</SelectItem>
                  <SelectItem value="NONE">Aucun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email_test">Email de test (optionnel)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email_test"
                  type="email"
                  placeholder={formData.utilisateur_smtp || "email@exemple.com"}
                  className="pl-10"
                  value={formData.email_test}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_test: e.target.value }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Laissez vide pour utiliser l'adresse SMTP configurée
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="actif"
                checked={formData.actif}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, actif: checked }))}
              />
              <Label htmlFor="actif">Activer cette configuration</Label>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Enregistrer la configuration
              </Button>
              <Button type="button" variant="outline" onClick={testConnection}>
                <Shield className="w-4 h-4 mr-2" />
                Tester
              </Button>
            </div>
          </form>
          
          {config && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Informations de configuration</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>Serveur: {config.serveur_smtp}:{config.port_smtp}</p>
                <p>Utilisateur: {config.utilisateur_smtp}</p>
                <p>Chiffrement: {config.encryption_type}</p>
                <p>Statut: {config.actif ? "Actif" : "Inactif"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}