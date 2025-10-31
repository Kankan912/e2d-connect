import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, Send, Mail, Filter, X, Info } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Template {
  id: string;
  code: string;
  nom: string;
  categorie: string;
  description: string | null;
  template_sujet: string;
  template_contenu: string;
  email_expediteur: string | null;
  variables_disponibles: string[];
  actif: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  'Compte utilisateur',
  'Réunion',
  'Trésorerie',
  'Prêt',
  'Sport',
  'Général'
];

export default function NotificationsTemplatesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [filterCategorie, setFilterCategorie] = useState<string>('all');
  const [testEmail, setTestEmail] = useState('');
  const [smtpConfig, setSMTPConfig] = useState<any>(null);

  // Formulaire
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    categorie: 'Général',
    description: '',
    template_sujet: '',
    template_contenu: '',
    email_expediteur: '',
    variables_disponibles: [] as string[],
    actif: true
  });

  // Query pour récupérer les templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['notifications-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Template[];
    }
  });

  // Charger la config SMTP
  useEffect(() => {
    let isMounted = true;
    
    const loadSMTPConfig = async () => {
      const { data } = await supabase
        .from('smtp_config')
        .select('*')
        .eq('actif', true)
        .limit(1)
        .maybeSingle();
      
      if (isMounted && data) setSMTPConfig(data);
    };
    
    loadSMTPConfig();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtrer templates
  const filteredTemplates = templates?.filter(t => 
    filterCategorie === 'all' || t.categorie === filterCategorie
  ) || [];

  // Mutation création
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('notifications_templates')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-templates'] });
      toast({ title: 'Template créé avec succès' });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutation mise à jour
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('notifications_templates')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-templates'] });
      toast({ title: 'Template modifié avec succès' });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutation suppression
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-templates'] });
      toast({ title: 'Template supprimé avec succès' });
      setIsDeleteDialogOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutation test email
  const testEmailMutation = useMutation({
    mutationFn: async ({ template, email }: { template: Template; email: string }) => {
      const testVariables: Record<string, string> = {};
      template.variables_disponibles.forEach(v => {
        testVariables[v] = `[${v.toUpperCase()}]`;
      });

      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type_notification: template.code,
          destinataire_email: email,
          variables: testVariables
        }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Email test envoyé avec succès' });
      setIsTestDialogOpen(false);
      setTestEmail('');
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur d\'envoi',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const resetForm = () => {
    setFormData({
      code: '',
      nom: '',
      categorie: 'Général',
      description: '',
      template_sujet: '',
      template_contenu: '',
      email_expediteur: '',
      variables_disponibles: [],
      actif: true
    });
    setSelectedTemplate(null);
  };

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      code: template.code,
      nom: template.nom,
      categorie: template.categorie,
      description: template.description || '',
      template_sujet: template.template_sujet,
      template_contenu: template.template_contenu,
      email_expediteur: template.email_expediteur || '',
      variables_disponibles: template.variables_disponibles,
      actif: template.actif
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAddVariable = () => {
    const variable = prompt('Nom de la variable (ex: nom_membre)');
    if (variable && variable.trim()) {
      setFormData(prev => ({
        ...prev,
        variables_disponibles: [...prev.variables_disponibles, variable.trim()]
      }));
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      variables_disponibles: prev.variables_disponibles.filter(v => v !== variable)
    }));
  };

  const closeTestDialog = () => {
    setIsTestDialogOpen(false);
    setTimeout(() => {
      setTestEmail('');
      setSelectedTemplate(null);
    }, 300);
  };

  const closeEditDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  const previewContent = (template: Template) => {
    let sujet = template.template_sujet;
    let contenu = template.template_contenu;
    
    template.variables_disponibles.forEach(v => {
      const regex = new RegExp(`{{${v}}}`, 'g');
      sujet = sujet.replace(regex, `[${v.toUpperCase()}]`);
      contenu = contenu.replace(regex, `[${v.toUpperCase()}]`);
    });

    return { sujet, contenu };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Gestion des Templates d'Emails
              </CardTitle>
              <CardDescription>
                Créez et gérez les modèles d'emails pour les notifications automatiques
              </CardDescription>
            </div>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex items-center gap-3 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterCategorie} onValueChange={setFilterCategorie}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Toutes catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterCategorie !== 'all' && (
              <Button variant="ghost" size="sm" onClick={() => setFilterCategorie('all')}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Liste des templates */}
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : filteredTemplates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun template {filterCategorie !== 'all' && 'dans cette catégorie'}
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Variables</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map(template => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.nom}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{template.categorie}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{template.code}</code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {template.variables_disponibles.slice(0, 3).map(v => (
                            <Badge key={v} variant="outline" className="text-xs">
                              {v}
                            </Badge>
                          ))}
                          {template.variables_disponibles.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.variables_disponibles.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.actif ? 'default' : 'secondary'}>
                          {template.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setIsPreviewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setIsTestDialogOpen(true);
                            }}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Création/Modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Modifier le template' : 'Créer un nouveau template'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="contenu">Contenu</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Code Technique *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="ex: rappel_cotisation"
                      required
                      disabled={!!selectedTemplate}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Identifiant unique (non modifiable après création)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="nom">Nom d'affichage *</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={e => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                      placeholder="ex: Rappel de Cotisation"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categorie">Catégorie *</Label>
                    <Select value={formData.categorie} onValueChange={v => setFormData(prev => ({ ...prev, categorie: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="email_expediteur" className="flex items-center gap-2">
                      Email expéditeur (optionnel)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Personnalise le nom d'affichage de l'expéditeur. 
                              L'authentification SMTP reste inchangée.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="email_expediteur"
                      type="email"
                      value={formData.email_expediteur}
                      onChange={e => setFormData(prev => ({ ...prev, email_expediteur: e.target.value }))}
                      placeholder="Exemple: tresorier@e2d.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Si vide, utilise: E2D &lt;{smtpConfig?.utilisateur_smtp || 'email-smtp'}&gt;
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description du template..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="actif">Template actif</Label>
                  <Switch
                    id="actif"
                    checked={formData.actif}
                    onCheckedChange={v => setFormData(prev => ({ ...prev, actif: v }))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="contenu" className="space-y-4">
                <div>
                  <Label htmlFor="template_sujet">Sujet de l'email *</Label>
                  <Input
                    id="template_sujet"
                    value={formData.template_sujet}
                    onChange={e => setFormData(prev => ({ ...prev, template_sujet: e.target.value }))}
                    placeholder="ex: Rappel - {{type_cotisation}}"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="template_contenu">Contenu de l'email *</Label>
                  <Textarea
                    id="template_contenu"
                    value={formData.template_contenu}
                    onChange={e => setFormData(prev => ({ ...prev, template_contenu: e.target.value }))}
                    placeholder="Utilisez {{nom_variable}} pour les variables dynamiques"
                    rows={12}
                    required
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Utilisez la syntaxe {`{{nom_variable}}`} pour insérer des variables
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="variables" className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Variables disponibles</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddVariable}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une variable
                    </Button>
                  </div>
                  {formData.variables_disponibles.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4 border rounded-md">
                      Aucune variable définie
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.variables_disponibles.map((v, index) => (
                        <Badge key={`${v}-${index}`} variant="secondary" className="text-sm py-1 px-3">
                          {`{{${v}}}`}
                          <button
                            type="button"
                            onClick={() => handleRemoveVariable(v)}
                            className="ml-2 hover:text-destructive"
                            aria-label={`Supprimer la variable ${v}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Ces variables seront remplacées par les valeurs réelles lors de l'envoi
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={closeEditDialog}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {selectedTemplate ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Prévisualisation */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aperçu du template</DialogTitle>
            <DialogDescription>
              Les variables sont remplacées par des exemples
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Sujet</Label>
                <p className="font-semibold">{previewContent(selectedTemplate).sujet}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Contenu</Label>
                <div className="border rounded-md p-4 bg-muted/30 whitespace-pre-wrap text-sm">
                  {previewContent(selectedTemplate).contenu}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Test Email */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer un email test</DialogTitle>
            <DialogDescription>
              Les variables seront remplacées par des valeurs d'exemple
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="test_email">Adresse email de test *</Label>
              <Input
                id="test_email"
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeTestDialog}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (!selectedTemplate || !testEmail.trim()) {
                    toast({
                      title: 'Erreur',
                      description: 'Veuillez saisir une adresse email valide',
                      variant: 'destructive'
                    });
                    return;
                  }
                  testEmailMutation.mutate({ template: selectedTemplate, email: testEmail.trim() });
                }}
                disabled={!testEmail.trim() || testEmailMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le template "{selectedTemplate?.nom}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTemplate(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTemplate && deleteMutation.mutate(selectedTemplate.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}