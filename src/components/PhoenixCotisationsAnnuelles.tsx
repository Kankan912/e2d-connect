import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Calendar, Plus, CheckCircle, AlertCircle, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CotisationAnnuelle {
  id: string;
  membre_id: string;
  annee: number;
  montant: number;
  date_paiement: string;
  statut: string;
  notes: string;
  membres: {
    nom: string;
    prenom: string;
  };
}

export default function PhoenixCotisationsAnnuelles() {
  const [showForm, setShowForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    membre_id: "",
    annee: new Date().getFullYear(),
    montant: 0,
    date_paiement: "",
    statut: "impaye",
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: cotisations } = useQuery({
    queryKey: ['phoenix-cotisations-annuelles', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phoenix_cotisations_annuelles' as any)
        .select(`
          *,
          membres:membre_id (
            nom,
            prenom
          )
        `)
        .eq('annee', selectedYear)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any;
    }
  });

  const { data: membres } = useQuery({
    queryKey: ['phoenix-membres-cotisations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phoenix_adherents')
        .select(`
          membre_id,
          membres:membre_id (
            id,
            nom,
            prenom
          )
        `);
      if (error) throw error;
      return data?.map(a => a.membres).filter(Boolean) || [];
    }
  });

  const createCotisationMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('phoenix_cotisations_annuelles' as any)
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoenix-cotisations-annuelles'] });
      toast.success("Cotisation enregistrée avec succès");
      resetForm();
    }
  });

  const updateCotisationMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from('phoenix_cotisations_annuelles' as any)
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoenix-cotisations-annuelles'] });
      toast.success("Cotisation mise à jour");
    }
  });

  const resetForm = () => {
    setFormData({
      membre_id: "",
      annee: new Date().getFullYear(),
      montant: 0,
      date_paiement: "",
      statut: "impaye",
      notes: ""
    });
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCotisationMutation.mutate(formData);
  };

  const markAsPaid = (cotisation: CotisationAnnuelle) => {
    updateCotisationMutation.mutate({
      id: cotisation.id,
      statut: "paye",
      date_paiement: new Date().toISOString().split('T')[0]
    });
  };

  const getStats = () => {
    if (!cotisations) return { total: 0, payees: 0, impayees: 0, montantTotal: 0, montantPaye: 0 };
    
    const payees = cotisations.filter(c => c.statut === 'paye');
    const montantTotal = cotisations.reduce((sum, c) => sum + c.montant, 0);
    const montantPaye = payees.reduce((sum, c) => sum + c.montant, 0);
    
    return {
      total: cotisations.length,
      payees: payees.length,
      impayees: cotisations.length - payees.length,
      montantTotal,
      montantPaye
    };
  };

  const stats = getStats();
  const years = [2024, 2025, 2026, 2027];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cotisations Annuelles Phoenix</h2>
          <p className="text-muted-foreground">Gestion des cotisations par année</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle cotisation
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total cotisations
            </CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payées
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.payees}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.payees / stats.total) * 100) : 0}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impayées
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.impayees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Montant collecté
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.montantPaye.toLocaleString()} FCFA</div>
            <p className="text-xs text-muted-foreground">
              sur {stats.montantTotal.toLocaleString()} FCFA
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des cotisations */}
      <Card>
        <CardHeader>
          <CardTitle>Cotisations {selectedYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cotisations?.map((cotisation) => (
              <div key={cotisation.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">
                      {cotisation.membres.prenom} {cotisation.membres.nom}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {cotisation.montant.toLocaleString()} FCFA
                    </p>
                    {cotisation.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{cotisation.notes}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {cotisation.date_paiement && (
                    <div className="text-right text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {new Date(cotisation.date_paiement).toLocaleDateString()}
                    </div>
                  )}
                  
                  <Badge 
                    variant={cotisation.statut === 'paye' ? 'default' : 'destructive'}
                    className="min-w-20 justify-center"
                  >
                    {cotisation.statut === 'paye' ? 'Payée' : 'Impayée'}
                  </Badge>
                  
                  {cotisation.statut !== 'paye' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => markAsPaid(cotisation)}
                      disabled={updateCotisationMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Marquer payée
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {(!cotisations || cotisations.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                Aucune cotisation enregistrée pour {selectedYear}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour créer une cotisation */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle cotisation annuelle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Membre</Label>
              <Select
                value={formData.membre_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, membre_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {membres?.map((membre: any) => (
                    <SelectItem key={membre.id} value={membre.id}>
                      {membre.prenom} {membre.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Année</Label>
                <Select
                  value={formData.annee.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, annee: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Montant (FCFA)</Label>
                <Input
                  type="number"
                  value={formData.montant}
                  onChange={(e) => setFormData(prev => ({ ...prev, montant: parseFloat(e.target.value) || 0 }))}
                  placeholder="5000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, statut: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="impaye">Impayée</SelectItem>
                    <SelectItem value="paye">Payée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date de paiement</Label>
                <Input
                  type="date"
                  value={formData.date_paiement}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_paiement: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Remarques, mode de paiement..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button type="submit" disabled={createCotisationMutation.isPending}>
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}