import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Download, Mail, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { exportToPDF } from '@/lib/pdfExport';
import { exportToExcel } from '@/lib/excelUtils';

interface ExportAutomatise {
  id: string;
  nom: string;
  type: 'rapport_financier' | 'analytics' | 'cotisations' | 'prets';
  frequence: 'quotidien' | 'hebdomadaire' | 'mensuel';
  format: 'PDF' | 'Excel';
  actif: boolean;
  dernierExport?: Date;
  prochainExport?: Date;
}

export const ExportScheduler = () => {
  const [exports, setExports] = useState<ExportAutomatise[]>([
    {
      id: '1',
      nom: 'Rapport Financier Mensuel',
      type: 'rapport_financier',
      frequence: 'mensuel',
      format: 'PDF',
      actif: true,
      prochainExport: new Date(new Date().setMonth(new Date().getMonth() + 1))
    },
    {
      id: '2',
      nom: 'Analytics Hebdomadaire',
      type: 'analytics',
      frequence: 'hebdomadaire',
      format: 'Excel',
      actif: false
    },
    {
      id: '3',
      nom: 'Suivi Cotisations Quotidien',
      type: 'cotisations',
      frequence: 'quotidien',
      format: 'Excel',
      actif: false
    }
  ]);
  const { toast } = useToast();

  const toggleExport = (id: string) => {
    setExports(exports.map(exp => 
      exp.id === id ? { ...exp, actif: !exp.actif } : exp
    ));
    toast({
      title: "Configuration mise à jour",
      description: "L'export automatisé a été modifié avec succès.",
    });
  };

  const executerExportMaintenant = async (exp: ExportAutomatise) => {
    toast({
      title: "Export en cours",
      description: `Génération du ${exp.nom}...`,
    });
    
    try {
      let donnees: any[] = [];
      let titre = exp.nom;
      let columns: any[] = [];
      
      // Récupérer les données selon le type
      switch (exp.type) {
        case 'rapport_financier':
          const [cotisations, epargnes, prets, sanctions] = await Promise.all([
            supabase.from('cotisations').select('*, membres(nom, prenom)'),
            supabase.from('epargnes').select('*, membres(nom, prenom)'),
            supabase.from('prets').select('*, membres(nom, prenom)'),
            supabase.from('sanctions').select('*, membres(nom, prenom)')
          ]);
          
          const totalCotis = cotisations.data?.reduce((s, c) => s + Number(c.montant), 0) || 0;
          const totalEpargnes = epargnes.data?.reduce((s, e) => s + Number(e.montant), 0) || 0;
          const totalPrets = prets.data?.reduce((s, p) => s + Number(p.montant), 0) || 0;
          const totalSanctions = sanctions.data?.reduce((s, sa) => s + Number(sa.montant), 0) || 0;
          
          donnees = [
            { type: 'Cotisations', montant: totalCotis, nombre: cotisations.data?.length || 0 },
            { type: 'Épargnes', montant: totalEpargnes, nombre: epargnes.data?.length || 0 },
            { type: 'Prêts', montant: totalPrets, nombre: prets.data?.length || 0 },
            { type: 'Sanctions', montant: totalSanctions, nombre: sanctions.data?.length || 0 },
            { type: 'TOTAL', montant: totalCotis + totalEpargnes - totalPrets + totalSanctions, nombre: '-' }
          ];
          
          columns = [
            { header: 'Type', dataKey: 'type' },
            { header: 'Montant (FCFA)', dataKey: 'montant' },
            { header: 'Nombre', dataKey: 'nombre' }
          ];
          break;
          
        case 'analytics':
          const { data: cotisAnalytics } = await supabase
            .from('cotisations')
            .select('*, membres(nom, prenom), cotisations_types(nom)')
            .order('date_paiement', { ascending: false })
            .limit(100);
          donnees = cotisAnalytics || [];
          
          columns = [
            { header: 'Date', dataKey: 'date_paiement' },
            { header: 'Membre', dataKey: 'membres' },
            { header: 'Type', dataKey: 'cotisations_types' },
            { header: 'Montant', dataKey: 'montant' }
          ];
          break;
          
        case 'cotisations':
          const { data: cotisData } = await supabase
            .from('cotisations')
            .select('*, membres(nom, prenom), cotisations_types(nom)')
            .order('date_paiement', { ascending: false });
          donnees = cotisData || [];
          
          columns = [
            { header: 'Date', dataKey: 'date_paiement' },
            { header: 'Membre', dataKey: 'membres' },
            { header: 'Type', dataKey: 'cotisations_types' },
            { header: 'Montant', dataKey: 'montant' },
            { header: 'Statut', dataKey: 'statut' }
          ];
          break;
          
        case 'prets':
          const { data: pretsData } = await supabase
            .from('prets')
            .select('*, membres(nom, prenom)')
            .order('date_pret', { ascending: false });
          donnees = pretsData || [];
          
          columns = [
            { header: 'Date', dataKey: 'date_pret' },
            { header: 'Membre', dataKey: 'membres' },
            { header: 'Montant', dataKey: 'montant' },
            { header: 'Montant Payé', dataKey: 'montant_paye' },
            { header: 'Échéance', dataKey: 'echeance' }
          ];
          break;
      }
      
      // Générer le fichier selon le format
      if (exp.format === 'PDF') {
        exportToPDF({
          title: titre,
          filename: `${titre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
          columns: columns,
          data: donnees
        });
      } else {
        exportToExcel({
          filename: `${titre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
          sheetName: titre.substring(0, 30),
          columns: columns,
          data: donnees
        });
      }
      
      toast({
        title: "Export terminé",
        description: `${exp.nom} a été généré avec succès.`,
      });
      
      // Mettre à jour la date du dernier export
      setExports(exports.map(e => 
        e.id === exp.id 
          ? { ...e, dernierExport: new Date() }
          : e
      ));
      
    } catch (error: any) {
      console.error('Erreur export:', error);
      toast({
        title: "Erreur d'export",
        description: error.message || "Une erreur s'est produite lors de l'export.",
        variant: "destructive",
      });
    }
  };

  const getFrequenceBadgeColor = (frequence: string) => {
    switch (frequence) {
      case 'quotidien':
        return 'default';
      case 'hebdomadaire':
        return 'secondary';
      case 'mensuel':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Exports Automatisés
            </CardTitle>
            <CardDescription>Configuration des rapports périodiques automatiques</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Configurer email
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {exports.map((exp) => (
            <Card key={exp.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={exp.actif}
                        onCheckedChange={() => toggleExport(exp.id)}
                      />
                      <div>
                        <div className="font-medium">{exp.nom}</div>
                        <div className="text-sm text-muted-foreground">
                          Format: {exp.format}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={getFrequenceBadgeColor(exp.frequence)}>
                        <Calendar className="h-3 w-3 mr-1" />
                        {exp.frequence}
                      </Badge>
                      {exp.actif && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      {exp.dernierExport && (
                        <div>
                          Dernier export: {exp.dernierExport.toLocaleDateString('fr-FR')} à {exp.dernierExport.toLocaleTimeString('fr-FR')}
                        </div>
                      )}
                      {exp.actif && exp.prochainExport && (
                        <div>
                          Prochain export: {exp.prochainExport.toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={() => executerExportMaintenant(exp)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exécuter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <div className="font-medium mb-1">Notification par email</div>
              <div>
                Les rapports automatisés peuvent être envoyés par email aux administrateurs et trésoriers.
                Configurez vos préférences d'envoi pour recevoir automatiquement vos exports.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
