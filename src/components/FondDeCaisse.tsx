import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { TrendingUp, TrendingDown, DollarSign, Calculator, Lock, Unlock, Plus, FileText, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { format, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FondOperation {
  id: string;
  date_operation: string;
  type_operation: 'entree' | 'sortie';
  montant: number;
  libelle: string;
  beneficiaire_id?: string;
  operateur_nom?: string;
  beneficiaire_nom?: string;
  notes?: string;
  created_at: string;
}

interface FondCloture {
  id: string;
  date_cloture: string;
  solde_ouverture: number;
  total_entrees: number;
  total_sorties: number;
  solde_theorique: number;
  solde_reel: number;
  ecart: number;
  cloture_par_nom?: string;
  notes?: string;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

export const FondDeCaisse: React.FC = () => {
  const [operations, setOperations] = useState<FondOperation[]>([]);
  const [clotures, setClotures] = useState<FondCloture[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [soldeActuel, setSoldeActuel] = useState(0);
  const [operationsJour, setOperationsJour] = useState<FondOperation[]>([]);
  const [estCloture, setEstCloture] = useState(false);
  const [loading, setLoading] = useState(true);

  // État pour nouvelle opération
  const [nouvelleOperation, setNouvelleOperation] = useState({
    type_operation: '' as 'entree' | 'sortie' | '',
    montant: '',
    libelle: '',
    beneficiaire_id: '',
    notes: ''
  });

  // État pour clôture
  const [soldeReel, setSoldeReel] = useState('');
  const [notesClotture, setNotesClotture] = useState('');

  const { toast } = useToast();

  const loadMembres = async () => {
    try {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .order('nom');

      if (error) throw error;
      setMembres(data || []);
    } catch (error) {
      console.error('Erreur chargement membres:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger opérations du jour
      const startDate = startOfDay(new Date(selectedDate));
      const endDate = endOfDay(new Date(selectedDate));

      const { data: operationsData, error: operationsError } = await supabase
        .from('fond_caisse_operations')
        .select(`
          *,
          beneficiaire:membres!beneficiaire_id(nom, prenom),
          operateur:membres!operateur_id(nom, prenom)
        `)
        .gte('date_operation', startDate.toISOString())
        .lte('date_operation', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (operationsError) throw operationsError;

      const operationsFormatted: FondOperation[] = (operationsData || []).map(op => ({
        id: op.id,
        date_operation: op.date_operation,
        type_operation: op.type_operation as 'entree' | 'sortie',
        montant: op.montant,
        libelle: op.libelle,
        beneficiaire_id: op.beneficiaire_id,
        notes: op.notes,
        created_at: op.created_at,
        beneficiaire_nom: op.beneficiaire ? `${op.beneficiaire.nom} ${op.beneficiaire.prenom}` : '',
        operateur_nom: op.operateur ? `${op.operateur.nom} ${op.operateur.prenom}` : ''
      }));

      setOperationsJour(operationsFormatted);

      // Vérifier si la journée est clôturée
      const { data: clotureData, error: clotureError } = await supabase
        .from('fond_caisse_clotures')
        .select('*')
        .eq('date_cloture', selectedDate)
        .maybeSingle();

      if (clotureError && clotureError.code !== 'PGRST116') {
        throw clotureError;
      }

      setEstCloture(!!clotureData);

      // Calculer le solde
      await calculerSolde();

      // Charger historique des clôtures
      const { data: cloturesData, error: cloturesError } = await supabase
        .from('fond_caisse_clotures')
        .select(`
          *,
          cloture_par:membres!cloture_par(nom, prenom)
        `)
        .order('date_cloture', { ascending: false })
        .limit(10);

      if (cloturesError) throw cloturesError;

      const cloturesFormatted = (cloturesData || []).map(cloture => ({
        ...cloture,
        cloture_par_nom: cloture.cloture_par ? `${cloture.cloture_par.nom} ${cloture.cloture_par.prenom}` : ''
      }));

      setClotures(cloturesFormatted);

    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du fond de caisse",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculerSolde = async () => {
    try {
      // Obtenir la dernière clôture
      const { data: derniereClotureData } = await supabase
        .from('fond_caisse_clotures')
        .select('solde_reel, date_cloture')
        .lt('date_cloture', selectedDate)
        .order('date_cloture', { ascending: false })
        .limit(1)
        .maybeSingle();

      const soldeOuverture = derniereClotureData?.solde_reel || 0;

      // Calculer les opérations depuis la dernière clôture
      const dateDebut = derniereClotureData?.date_cloture 
        ? new Date(derniereClotureData.date_cloture + 'T00:00:00')
        : new Date('2000-01-01');

      const { data: operationsDepuis } = await supabase
        .from('fond_caisse_operations')
        .select('type_operation, montant')
        .gte('date_operation', dateDebut.toISOString())
        .lte('date_operation', selectedDate + 'T23:59:59');

      let totalEntrees = 0;
      let totalSorties = 0;

      (operationsDepuis || []).forEach(op => {
        if (op.type_operation === 'entree') {
          totalEntrees += Number(op.montant);
        } else {
          totalSorties += Number(op.montant);
        }
      });

      setSoldeActuel(soldeOuverture + totalEntrees - totalSorties);

    } catch (error) {
      console.error('Erreur calcul solde:', error);
    }
  };

  useRealtimeUpdates({
    table: 'fond_caisse_operations',
    onUpdate: loadData,
    enabled: true
  });

  useRealtimeUpdates({
    table: 'fond_caisse_clotures',
    onUpdate: loadData,
    enabled: true
  });

  useEffect(() => {
    loadData();
    loadMembres();
  }, [selectedDate]);

  const ajouterOperation = async () => {
    if (!nouvelleOperation.type_operation || !nouvelleOperation.montant || !nouvelleOperation.libelle) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Utilisateur non connecté');

      const { data: membreData } = await supabase
        .from('membres')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!membreData) throw new Error('Membre non trouvé');

      const { error } = await supabase
        .from('fond_caisse_operations')
        .insert({
          date_operation: selectedDate,
          type_operation: nouvelleOperation.type_operation,
          montant: Number(nouvelleOperation.montant),
          libelle: nouvelleOperation.libelle,
          beneficiaire_id: nouvelleOperation.beneficiaire_id || null,
          operateur_id: membreData.id,
          notes: nouvelleOperation.notes || null
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Opération ajoutée avec succès"
      });

      // Réinitialiser le formulaire
      setNouvelleOperation({
        type_operation: '' as 'entree' | 'sortie' | '',
        montant: '',
        libelle: '',
        beneficiaire_id: '',
        notes: ''
      });

      loadData();

    } catch (error: any) {
      console.error('Erreur ajout opération:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'opération",
        variant: "destructive"
      });
    }
  };

  const cloturerJournee = async () => {
    if (!soldeReel) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir le solde réel",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Utilisateur non connecté');

      const { data: membreData } = await supabase
        .from('membres')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!membreData) throw new Error('Membre non trouvé');

      // Calculer les totaux du jour
      const totalEntrees = operationsJour
        .filter(op => op.type_operation === 'entree')
        .reduce((sum, op) => sum + Number(op.montant), 0);

      const totalSorties = operationsJour
        .filter(op => op.type_operation === 'sortie')
        .reduce((sum, op) => sum + Number(op.montant), 0);

      // Obtenir solde d'ouverture
      const { data: derniereClotureData } = await supabase
        .from('fond_caisse_clotures')
        .select('solde_reel')
        .lt('date_cloture', selectedDate)
        .order('date_cloture', { ascending: false })
        .limit(1)
        .maybeSingle();

      const soldeOuverture = derniereClotureData?.solde_reel || 0;
      const soldeTheorique = soldeOuverture + totalEntrees - totalSorties;

      const { error } = await supabase
        .from('fond_caisse_clotures')
        .insert({
          date_cloture: selectedDate,
          solde_ouverture: soldeOuverture,
          total_entrees: totalEntrees,
          total_sorties: totalSorties,
          solde_theorique: soldeTheorique,
          solde_reel: Number(soldeReel),
          cloture_par: membreData.id,
          notes: notesClotture || null
        });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Journée clôturée avec succès"
      });

      setSoldeReel('');
      setNotesClotture('');
      loadData();

    } catch (error: any) {
      console.error('Erreur clôture:', error);
      toast({
        title: "Erreur",
        description: "Impossible de clôturer la journée",
        variant: "destructive"
      });
    }
  };

  const totalEntreesJour = operationsJour
    .filter(op => op.type_operation === 'entree')
    .reduce((sum, op) => sum + Number(op.montant), 0);

  const totalSortiesJour = operationsJour
    .filter(op => op.type_operation === 'sortie')
    .reduce((sum, op) => sum + Number(op.montant), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement du fond de caisse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec sélection de date */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Fond de Caisse
          </h1>
          <p className="text-muted-foreground">
            Gestion quotidienne des entrées et sorties de caisse
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          
          {estCloture ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Clôturé
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <Unlock className="h-3 w-3" />
              Ouvert
            </Badge>
          )}
        </div>
      </div>

      {/* Résumé financier */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde Actuel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {soldeActuel.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrées du Jour</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{totalEntreesJour.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sorties du Jour</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{totalSortiesJour.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mouvement Net</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (totalEntreesJour - totalSortiesJour) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(totalEntreesJour - totalSortiesJour) >= 0 ? '+' : ''}
              {(totalEntreesJour - totalSortiesJour).toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nouvelle opération */}
        {!estCloture && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nouvelle Opération
              </CardTitle>
              <CardDescription>
                Ajouter une entrée ou sortie de caisse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type d'opération *</Label>
                  <Select 
                    value={nouvelleOperation.type_operation} 
                    onValueChange={(value: 'entree' | 'sortie') => 
                      setNouvelleOperation({...nouvelleOperation, type_operation: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entree">Entrée</SelectItem>
                      <SelectItem value="sortie">Sortie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="montant">Montant (FCFA) *</Label>
                  <Input
                    id="montant"
                    type="number"
                    value={nouvelleOperation.montant}
                    onChange={(e) => setNouvelleOperation({...nouvelleOperation, montant: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="libelle">Libellé *</Label>
                <Input
                  id="libelle"
                  value={nouvelleOperation.libelle}
                  onChange={(e) => setNouvelleOperation({...nouvelleOperation, libelle: e.target.value})}
                  placeholder="Description de l'opération"
                />
              </div>

              <div>
                <Label htmlFor="beneficiaire">Bénéficiaire</Label>
                <Select 
                  value={nouvelleOperation.beneficiaire_id} 
                  onValueChange={(value) => 
                    setNouvelleOperation({...nouvelleOperation, beneficiaire_id: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un membre (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {membres.map((membre) => (
                      <SelectItem key={membre.id} value={membre.id}>
                        {membre.nom} {membre.prenom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={nouvelleOperation.notes}
                  onChange={(e) => setNouvelleOperation({...nouvelleOperation, notes: e.target.value})}
                  placeholder="Informations complémentaires..."
                  rows={2}
                />
              </div>

              <Button onClick={ajouterOperation} className="w-full">
                Ajouter l'opération
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Opérations du jour */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Opérations du {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}
            </CardTitle>
            <CardDescription>
              {operationsJour.length} opération(s) enregistrée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {operationsJour.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucune opération pour cette date
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {operationsJour.map((operation) => (
                  <div key={operation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={operation.type_operation === 'entree' ? 'default' : 'destructive'}>
                          {operation.type_operation === 'entree' ? 'ENTRÉE' : 'SORTIE'}
                        </Badge>
                        <span className="font-medium">{operation.libelle}</span>
                      </div>
                      {operation.beneficiaire_nom && (
                        <p className="text-sm text-muted-foreground">
                          Bénéficiaire: {operation.beneficiaire_nom}
                        </p>
                      )}
                      {operation.notes && (
                        <p className="text-sm text-muted-foreground">
                          Notes: {operation.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Par {operation.operateur_nom} à {format(new Date(operation.created_at), 'HH:mm')}
                      </p>
                    </div>
                    <div className={`text-lg font-bold ${
                      operation.type_operation === 'entree' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {operation.type_operation === 'entree' ? '+' : '-'}
                      {Number(operation.montant).toLocaleString()} FCFA
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clôture journalière */}
      {!estCloture && operationsJour.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Clôture de la Journée
            </CardTitle>
            <CardDescription>
              Finaliser les opérations et enregistrer le solde réel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="solde-reel">Solde Réel (FCFA) *</Label>
                <Input
                  id="solde-reel"
                  type="number"
                  value={soldeReel}
                  onChange={(e) => setSoldeReel(e.target.value)}
                  placeholder="Montant réel en caisse"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Solde théorique: {soldeActuel.toLocaleString()} FCFA
                </p>
              </div>

              <div>
                <Label htmlFor="notes-cloture">Notes de clôture</Label>
                <Textarea
                  id="notes-cloture"
                  value={notesClotture}
                  onChange={(e) => setNotesClotture(e.target.value)}
                  placeholder="Observations, écarts..."
                  rows={2}
                />
              </div>
            </div>

            <Separator className="my-4" />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  Clôturer la Journée
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la clôture</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir clôturer cette journée ? Cette action est irréversible.
                    {soldeReel && (
                      <div className="mt-2 p-2 bg-muted rounded">
                        <strong>Écart:</strong> {(Number(soldeReel) - soldeActuel).toLocaleString()} FCFA
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={cloturerJournee}>
                    Confirmer la clôture
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Historique des clôtures */}
      {clotures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historique des Clôtures
            </CardTitle>
            <CardDescription>
              Dernières clôtures journalières
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clotures.map((cloture) => (
                <div key={cloture.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {format(new Date(cloture.date_cloture), 'dd MMMM yyyy', { locale: fr })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Clôturé par {cloture.cloture_par_nom}
                    </div>
                    {cloture.notes && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {cloture.notes}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {Number(cloture.solde_reel).toLocaleString()} FCFA
                    </div>
                    {Number(cloture.ecart) !== 0 && (
                      <div className={`text-sm ${Number(cloture.ecart) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Écart: {Number(cloture.ecart) >= 0 ? '+' : ''}{Number(cloture.ecart).toLocaleString()} FCFA
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};