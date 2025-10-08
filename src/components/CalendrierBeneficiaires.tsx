import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Plus, Edit, Trash2, Users, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendrierEntry {
  id: string;
  mois: number;
  annee: number;
  membre_id: string;
  montant_attribue: number;
  total_cotisations_mois: number;
  membre?: {
    nom: string;
    prenom: string;
  };
}

interface Reunion {
  id: string;
  date_reunion: string;
  statut: string;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

export default function CalendrierBeneficiaires() {
  const [entries, setEntries] = useState<CalendrierEntry[]>([]);
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CalendrierEntry | null>(null);
  const [formData, setFormData] = useState({
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    membre_id: '',
    montant_attribue: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [entriesRes, reunionsRes, membresRes] = await Promise.all([
        supabase
          .from('tontine_attributions')
          .select('*')
          .order('annee', { ascending: false })
          .order('mois', { ascending: true }),
        supabase
          .from('reunions')
          .select('id, date_reunion, statut')
          .order('date_reunion', { ascending: false }),
        supabase
          .from('membres')
          .select('id, nom, prenom')
          .eq('statut', 'actif')
          .order('nom')
      ]);

      if (entriesRes.error) throw entriesRes.error;
      if (reunionsRes.error) throw reunionsRes.error;
      if (membresRes.error) throw membresRes.error;

      // Enrichir les entries avec les données des membres
      const entriesWithMembres = await Promise.all(
        (entriesRes.data || []).map(async (entry) => {
          const { data: membre } = await supabase
            .from('membres')
            .select('nom, prenom')
            .eq('id', entry.membre_id)
            .single();
          
          return {
            ...entry,
            membre: membre || { nom: '', prenom: '' }
          };
        })
      );

      setEntries(entriesWithMembres);
      setReunions(reunionsRes.data || []);
      setMembres(membresRes.data || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAutoCalendar = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const membresAvailable = membres.filter(m => m);
      
      if (membresAvailable.length === 0) {
        toast({
          title: "Erreur",
          description: "Aucun membre disponible",
          variant: "destructive",
        });
        return;
      }

      // Supprimer les attributions existantes pour l'année courante
      await supabase
        .from('tontine_attributions')
        .delete()
        .eq('annee', currentYear);

      // Générer automatiquement les attributions (un membre par mois)
      const attributions = [];
      for (let mois = 1; mois <= 12; mois++) {
        const membreIndex = (mois - 1) % membresAvailable.length;
        const membre = membresAvailable[membreIndex];
        
        // Calcul estimé basé sur les cotisations moyennes
        const montantEstime = 50000; // Montant de base estimé
        
        attributions.push({
          mois,
          annee: currentYear,
          membre_id: membre.id,
          montant_attribue: montantEstime,
          total_cotisations_mois: montantEstime * 1.1
        });
      }

      const { error } = await supabase
        .from('tontine_attributions')
        .insert(attributions);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Calendrier généré pour ${currentYear}`,
      });

      loadData();
    } catch (error) {
      console.error('Erreur génération:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le calendrier",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        mois: formData.mois,
        annee: formData.annee,
        membre_id: formData.membre_id,
        montant_attribue: formData.montant_attribue,
        total_cotisations_mois: formData.montant_attribue * 1.1
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('tontine_attributions')
          .update(payload)
          .eq('id', editingEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tontine_attributions')
          .insert([payload]);
        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: editingEntry ? "Attribution modifiée" : "Attribution ajoutée",
      });

      setShowForm(false);
      setEditingEntry(null);
      setFormData({
        mois: new Date().getMonth() + 1,
        annee: new Date().getFullYear(),
        membre_id: '',
        montant_attribue: 0
      });
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (entry: CalendrierEntry) => {
    setEditingEntry(entry);
    setFormData({
      mois: entry.mois,
      annee: entry.annee,
      membre_id: entry.membre_id,
      montant_attribue: entry.montant_attribue
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tontine_attributions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({ title: "Supprimé" });
      loadData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPayment = async (entry: CalendrierEntry) => {
    try {
      // Créer une opération de fond de caisse pour le paiement du bénéficiaire
      const { error: fondCaisseError } = await supabase
        .from('fond_caisse_operations')
        .insert({
          type_operation: 'sortie',
          montant: entry.montant_attribue,
          libelle: `Paiement bénéficiaire tontine - ${getMonthName(entry.mois)} ${entry.annee}`,
          beneficiaire_id: entry.membre_id,
          operateur_id: entry.membre_id, // Temporaire, devrait être l'utilisateur connecté
          date_operation: new Date().toISOString().split('T')[0]
        });

      if (fondCaisseError) throw fondCaisseError;

      // Marquer l'attribution comme payée (si on avait un champ statut)
      toast({
        title: "Paiement confirmé",
        description: `Paiement de ${entry.montant_attribue.toLocaleString()} FCFA confirmé pour ${entry.membre?.prenom} ${entry.membre?.nom}`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de confirmer le paiement: " + error.message,
        variant: "destructive",
      });
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[month - 1];
  };

  const getReunionForMonth = (mois: number, annee: number) => {
    return reunions.find(r => {
      const date = new Date(r.date_reunion);
      return date.getMonth() + 1 === mois && date.getFullYear() === annee;
    });
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Calendrier des Bénéficiaires Tontine</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateAutoCalendar}>
            <Users className="h-4 w-4 mr-2" />
            Générer auto
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Calendrier */}
      <Card>
        <CardHeader>
          <CardTitle>Planning annuel</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Réunion</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const reunion = getReunionForMonth(entry.mois, entry.annee);
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getMonthName(entry.mois)} {entry.annee}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {entry.membre?.prenom} {entry.membre?.nom}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-green-600">
                        {entry.montant_attribue.toLocaleString()} FCFA
                      </p>
                    </TableCell>
                    <TableCell>
                      {reunion ? (
                        <Badge variant={reunion.statut === 'termine' ? 'default' : 'outline'}>
                          {new Date(reunion.date_reunion).toLocaleDateString('fr-FR')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pas de réunion</Badge>
                      )}
                    </TableCell>
                     <TableCell>
                       <div className="flex gap-2">
                         <Button size="sm" variant="outline" onClick={() => handleEdit(entry)}>
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button 
                           size="sm" 
                           variant="default" 
                           className="bg-success hover:bg-success/90"
                           onClick={() => handleConfirmPayment(entry)}
                         >
                           Confirmer paiement
                         </Button>
                         <Button size="sm" variant="destructive" onClick={() => handleDelete(entry.id)}>
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </TableCell>
                  </TableRow>
                );
              })}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Aucune attribution planifiée. Utilisez "Générer auto" pour commencer.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Modifier' : 'Ajouter'} une attribution
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mois</Label>
                <Select
                  value={formData.mois.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, mois: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {getMonthName(i + 1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Année</Label>
                <Input
                  type="number"
                  value={formData.annee}
                  onChange={(e) => setFormData(prev => ({ ...prev, annee: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Bénéficiaire</Label>
              <Select
                value={formData.membre_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, membre_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {membres.map((membre) => (
                    <SelectItem key={membre.id} value={membre.id}>
                      {membre.prenom} {membre.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Montant attribué (FCFA)</Label>
              <Input
                type="number"
                value={formData.montant_attribue}
                onChange={(e) => setFormData(prev => ({ ...prev, montant_attribue: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingEntry ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}