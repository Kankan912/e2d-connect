import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, FileText, FileSpreadsheet, BarChart3, 
  Calendar, Users, DollarSign, Settings,
  CheckCircle2, Clock, AlertTriangle, Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LogoHeader from './LogoHeader';
import { ExportService } from '@/lib/exportService';

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  periode: 'mois' | 'trimestre' | 'semestre' | 'annee' | 'personnalise';
  dateDebut?: string;
  dateFin?: string;
  modules: string[];
  includeGraphiques: boolean;
  includeStatistiques: boolean;
  includeDetails: boolean;
}

interface ExportJob {
  id: string;
  nom: string;
  type: string;
  statut: 'en_cours' | 'termine' | 'erreur';
  progression: number;
  dateCreation: Date;
  tailleFichier?: number;
  urlTelechargement?: string;
}

export const ExportRapports: React.FC = () => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    periode: 'annee',
    modules: [],
    includeGraphiques: true,
    includeStatistiques: true,
    includeDetails: false
  });
  
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const modulesDisponibles = [
    { id: 'cotisations', nom: 'Cotisations', description: 'Toutes les cotisations et leurs détails' },
    { id: 'epargnes', nom: 'Épargnes', description: 'Historique des épargnes des membres' },
    { id: 'prets', nom: 'Prêts', description: 'Prêts accordés et remboursements' },
    { id: 'aides', nom: 'Aides', description: 'Aides distribuées aux membres' },
    { id: 'sanctions', nom: 'Sanctions', description: 'Sanctions appliquées' },
    { id: 'membres', nom: 'Membres', description: 'Liste et informations des membres' },
    { id: 'reunions', nom: 'Réunions', description: 'Historique des réunions et présences' },
    { id: 'sport_e2d', nom: 'Sport E2D', description: 'Matchs et statistiques E2D' },
    { id: 'sport_phoenix', nom: 'Sport Phoenix', description: 'Matchs et statistiques Phoenix' },
    { id: 'finances', nom: 'Finances Globales', description: 'Vue d\'ensemble financière' }
  ];

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    if (checked) {
      setOptions(prev => ({ ...prev, modules: [...prev.modules, moduleId] }));
    } else {
      setOptions(prev => ({ ...prev, modules: prev.modules.filter(m => m !== moduleId) }));
    }
  };


  const collectData = async (options: ExportOptions) => {
    const data: any = {};
    
    // Calculer les dates selon la période
    const now = new Date();
    let startDate = new Date();
    let endDate = now;

    switch (options.periode) {
      case 'mois':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'trimestre':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'semestre':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'annee':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'personnalise':
        if (options.dateDebut && options.dateFin) {
          startDate = new Date(options.dateDebut);
          endDate = new Date(options.dateFin);
        }
        break;
    }

    // Collecter les données pour chaque module
    for (const moduleId of options.modules) {
      try {
        switch (moduleId) {
          case 'cotisations':
            const cotisationsRes = await supabase
              .from('cotisations')
              .select(`
                *,
                membres(nom, prenom),
                cotisations_types(nom)
              `)
              .gte('created_at', startDate.toISOString())
              .lte('created_at', endDate.toISOString());

            if (cotisationsRes.data) {
              const total = cotisationsRes.data.reduce((sum, item) => sum + Number(item.montant), 0);
              data.cotisations = {
                stats: {
                  total,
                  nombre: cotisationsRes.data.length,
                  moyenne: cotisationsRes.data.length > 0 ? total / cotisationsRes.data.length : 0
                },
                details: cotisationsRes.data.map(item => ({
                  Date: new Date(item.date_paiement || item.created_at).toLocaleDateString('fr-FR'),
                  Membre: `${item.membres?.prenom} ${item.membres?.nom}`,
                  Type: item.cotisations_types?.nom,
                  Montant: item.montant,
                  Statut: item.statut
                }))
              };
            }
            break;

          case 'epargnes':
            const epargnessRes = await supabase
              .from('epargnes')
              .select(`
                *,
                membres(nom, prenom)
              `)
              .gte('created_at', startDate.toISOString())
              .lte('created_at', endDate.toISOString());

            if (epargnessRes.data) {
              const total = epargnessRes.data.reduce((sum, item) => sum + Number(item.montant), 0);
              data.epargnes = {
                stats: {
                  total,
                  nombre: epargnessRes.data.length,
                  moyenne: epargnessRes.data.length > 0 ? total / epargnessRes.data.length : 0
                },
                details: epargnessRes.data.map(item => ({
                  Date: new Date(item.date_depot).toLocaleDateString('fr-FR'),
                  Membre: `${item.membres?.prenom} ${item.membres?.nom}`,
                  Montant: item.montant,
                  Statut: item.statut
                }))
              };
            }
            break;

          case 'prets':
            const pretsRes = await supabase
              .from('prets')
              .select('*')
              .gte('created_at', startDate.toISOString())
              .lte('created_at', endDate.toISOString());

            // Fetch members separately to avoid join issues
            const pretsMembresRes = await supabase
              .from('membres')
              .select('id, nom, prenom');

            if (pretsRes.data && pretsMembresRes.data) {
              const membresMap = new Map(pretsMembresRes.data.map(m => [m.id, m]));
              const total = pretsRes.data.reduce((sum, item) => sum + Number(item.montant), 0);
              
              data.prets = {
                stats: {
                  total,
                  nombre: pretsRes.data.length,
                  moyenne: pretsRes.data.length > 0 ? total / pretsRes.data.length : 0
                },
                details: pretsRes.data.map(item => {
                  const membre = membresMap.get(item.membre_id);
                  return {
                    Date: new Date(item.date_pret).toLocaleDateString('fr-FR'),
                    Membre: membre ? `${membre.prenom} ${membre.nom}` : 'Membre inconnu',
                    Montant: item.montant,
                    'Taux Intérêt': item.taux_interet + '%',
                    Échéance: new Date(item.echeance).toLocaleDateString('fr-FR'),
                    Statut: item.statut
                  };
                })
              };
            }
            break;

          case 'membres':
            const allMembresRes = await supabase.from('membres').select('*');
            if (allMembresRes.data) {
              data.membres = {
                stats: {
                  total: allMembresRes.data.length,
                  actifs: allMembresRes.data.filter(m => m.statut === 'actif').length,
                  inactifs: allMembresRes.data.filter(m => m.statut === 'inactif').length
                },
                details: allMembresRes.data.map(item => ({
                  Nom: item.nom,
                  Prénom: item.prenom,
                  Téléphone: item.telephone,
                  Email: item.email,
                  Statut: item.statut,
                  'Date Inscription': new Date(item.date_inscription || item.created_at).toLocaleDateString('fr-FR')
                }))
              };
            }
            break;

          // Ajouter d'autres modules selon les besoins...
        }
      } catch (error) {
        console.error(`Erreur lors de la collecte des données pour ${moduleId}:`, error);
      }
    }

    return data;
  };

  const handleExport = async () => {
    if (options.modules.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un module à exporter.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Créer un job d'export
      const newJob: ExportJob = {
        id: Date.now().toString(),
        nom: `Rapport ${options.format.toUpperCase()} - ${new Date().toLocaleDateString('fr-FR')}`,
        type: options.format,
        statut: 'en_cours',
        progression: 0,
        dateCreation: new Date()
      };

      setJobs(prev => [newJob, ...prev]);

      // Simuler la progression
      const updateProgress = (progress: number) => {
        setJobs(prev => prev.map(job => 
          job.id === newJob.id ? { ...job, progression: progress } : job
        ));
      };

      updateProgress(10);

      // Collecter les données
      const data = await collectData(options);
      updateProgress(50);

      // Préparer les colonnes et statistiques pour ExportService
      const firstModuleId = options.modules[0];
      const firstModuleData = data[firstModuleId];
      
      if (!firstModuleData?.details || firstModuleData.details.length === 0) {
        throw new Error('Aucune donnée à exporter');
      }

      // Extraire les colonnes du premier module
      const columns = Object.keys(firstModuleData.details[0]).map(key => ({
        header: key,
        dataKey: key
      }));

      // Calculer les statistiques globales
      const stats = [];
      for (const moduleId of options.modules) {
        const moduleData = data[moduleId];
        if (moduleData?.stats && options.includeStatistiques) {
          Object.entries(moduleData.stats).forEach(([key, value]: [string, any]) => {
            stats.push({
              label: `${modulesDisponibles.find(m => m.id === moduleId)?.nom} - ${key}`,
              value: typeof value === 'number' ? value.toLocaleString('fr-FR') : value
            });
          });
        }
      }

      // Aplatir les données de tous les modules
      const allData = options.modules.flatMap(moduleId => data[moduleId]?.details || []);

      updateProgress(70);

      // Utiliser ExportService pour générer le fichier
      await ExportService.export({
        format: options.format,
        title: `Rapport E2D - ${options.modules.map(m => modulesDisponibles.find(mod => mod.id === m)?.nom).join(', ')}`,
        data: allData,
        columns,
        metadata: {
          association: 'Association E2D',
          dateGeneration: new Date(),
          periode: options.dateDebut && options.dateFin 
            ? `${options.dateDebut} au ${options.dateFin}` 
            : options.periode
        },
        stats: stats.length > 0 ? stats : undefined
      });

      updateProgress(90);

      // Simuler le blob pour la taille du fichier
      const blob = new Blob([JSON.stringify(allData)], { type: 'application/json' });

      updateProgress(100);

      // Marquer le job comme terminé
      setJobs(prev => prev.map(job => 
        job.id === newJob.id ? { 
          ...job, 
          statut: 'termine', 
          progression: 100,
          tailleFichier: blob.size
        } : job
      ));

      toast({
        title: "Export réussi",
        description: `Le rapport ${options.format.toUpperCase()} a été généré et téléchargé avec succès.`,
      });

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de la génération du rapport.",
        variant: "destructive",
      });

      // Marquer le job comme en erreur
      setJobs(prev => prev.map(job => 
        job.id === jobs[0]?.id ? { ...job, statut: 'erreur' } : job
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <LogoHeader title="Export de Rapports" subtitle="Génération et téléchargement de rapports personnalisés" />

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration de l'export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paramètres d'Export
                </CardTitle>
                <CardDescription>
                  Configurez les options de génération de votre rapport
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="format">Format de fichier</Label>
                  <Select
                    value={options.format}
                    onValueChange={(value: 'pdf' | 'excel' | 'csv') => setOptions(prev => ({ ...prev, format: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          PDF - Rapport formaté
                        </div>
                      </SelectItem>
                      <SelectItem value="excel">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Excel - Données tabulaires
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          CSV - Données brutes
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="periode">Période</Label>
                  <Select
                    value={options.periode}
                    onValueChange={(value: any) => setOptions(prev => ({ ...prev, periode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mois">Dernier mois</SelectItem>
                      <SelectItem value="trimestre">Dernier trimestre</SelectItem>
                      <SelectItem value="semestre">Dernier semestre</SelectItem>
                      <SelectItem value="annee">Dernière année</SelectItem>
                      <SelectItem value="personnalise">Période personnalisée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {options.periode === 'personnalise' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateDebut">Date début</Label>
                      <Input
                        id="dateDebut"
                        type="date"
                        value={options.dateDebut || ''}
                        onChange={(e) => setOptions(prev => ({ ...prev, dateDebut: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateFin">Date fin</Label>
                      <Input
                        id="dateFin"
                        type="date"
                        value={options.dateFin || ''}
                        onChange={(e) => setOptions(prev => ({ ...prev, dateFin: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Options d'inclusion</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="statistiques"
                        checked={options.includeStatistiques}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeStatistiques: !!checked }))}
                      />
                      <Label htmlFor="statistiques">Inclure les statistiques</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="graphiques"
                        checked={options.includeGraphiques}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeGraphiques: !!checked }))}
                      />
                      <Label htmlFor="graphiques">Inclure les graphiques (PDF uniquement)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="details"
                        checked={options.includeDetails}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeDetails: !!checked }))}
                      />
                      <Label htmlFor="details">Inclure les détails des données</Label>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleExport} 
                  disabled={loading || options.modules.length === 0}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Génération en cours...' : 'Générer le Rapport'}
                </Button>
              </CardContent>
            </Card>

            {/* Sélection des modules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Modules à Inclure
                </CardTitle>
                <CardDescription>
                  Sélectionnez les données à inclure dans votre rapport
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {modulesDisponibles.map((module) => (
                    <div key={module.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={module.id}
                        checked={options.modules.includes(module.id)}
                        onCheckedChange={(checked) => handleModuleToggle(module.id, !!checked)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={module.id} className="font-medium">
                          {module.nom}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {options.modules.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Modules sélectionnés:</p>
                    <div className="flex flex-wrap gap-1">
                      {options.modules.map((moduleId) => {
                        const module = modulesDisponibles.find(m => m.id === moduleId);
                        return (
                          <Badge key={moduleId} variant="secondary">
                            {module?.nom}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historique" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Exports</CardTitle>
              <CardDescription>
                Suivez l'état de vos exports et téléchargez les rapports générés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun export dans l'historique</p>
                  <p className="text-sm text-muted-foreground">
                    Configurez et générez votre premier rapport
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{job.nom}</h4>
                          <p className="text-sm text-muted-foreground">
                            {job.dateCreation.toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            job.statut === 'termine' ? 'default' :
                            job.statut === 'erreur' ? 'destructive' : 'secondary'
                          }>
                            {job.statut === 'en_cours' && <Clock className="h-3 w-3 mr-1" />}
                            {job.statut === 'termine' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                            {job.statut === 'erreur' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {job.statut === 'en_cours' ? 'En cours' :
                             job.statut === 'termine' ? 'Terminé' : 'Erreur'}
                          </Badge>
                          <Badge variant="outline">{job.type.toUpperCase()}</Badge>
                        </div>
                      </div>

                      {job.statut === 'en_cours' && (
                        <div className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progression</span>
                            <span>{job.progression}%</span>
                          </div>
                          <Progress value={job.progression} className="h-2" />
                        </div>
                      )}

                      {job.tailleFichier && (
                        <p className="text-sm text-muted-foreground">
                          Taille: {(job.tailleFichier / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};