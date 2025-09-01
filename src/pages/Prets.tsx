import { useState, useEffect } from "react";
import { Plus, Edit, Eye, FileText, DollarSign, Calendar, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PretForm from "@/components/forms/PretForm";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Pret {
  id: string;
  membre_id: string;
  montant: number;
  date_pret: string;
  echeance: string;
  statut: string;
  taux_interet: number;
  reconductions: number;
  justificatif_url?: string;
  notes?: string;
  membres?: {
    nom: string;
    prenom: string;
  } | null;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

export default function Prets() {
  const [prets, setPrets] = useState<Pret[]>([]);
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPret, setSelectedPret] = useState<Pret | null>(null);
  const [formData, setFormData] = useState({
    membre_id: "",
    montant: "",
    echeance: "",
    notes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPrets();
    fetchMembres();
  }, []);

  const fetchPrets = async () => {
    try {
      const { data, error } = await supabase
        .from('prets')
        .select(`
          *,
          membres!membre_id (
            nom,
            prenom
          )
        `)
        .order('date_pret', { ascending: false });

      if (error) throw error;
      setPrets(data || []);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les prêts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMembres = async () => {
    try {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .order('nom');

      if (error) throw error;
      setMembres(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.membre_id || !formData.montant || !formData.echeance) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const pretData = {
        membre_id: formData.membre_id,
        montant: parseFloat(formData.montant),
        echeance: formData.echeance,
        notes: formData.notes || null,
        taux_interet: 5.0
      };

      const { error } = selectedPret
        ? await supabase
            .from('prets')
            .update(pretData)
            .eq('id', selectedPret.id)
        : await supabase
            .from('prets')
            .insert([pretData]);

      if (error) throw error;

      toast({
        title: "Succès",
        description: selectedPret ? "Prêt modifié avec succès" : "Prêt ajouté avec succès",
      });

      setShowAddDialog(false);
      setSelectedPret(null);
      setFormData({ membre_id: "", montant: "", echeance: "", notes: "" });
      fetchPrets();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le prêt",
        variant: "destructive",
      });
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rembourse': return 'bg-green-100 text-green-800 border-green-200';
      case 'en_retard': return 'bg-red-100 text-red-800 border-red-200';
      case 'reconduit': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'en_cours': return 'En cours';
      case 'rembourse': return 'Remboursé';
      case 'en_retard': return 'En retard';
      case 'reconduit': return 'Reconduit';
      default: return statut;
    }
  };

  const openEditDialog = (pret: Pret) => {
    setSelectedPret(pret);
    setFormData({
      membre_id: pret.membre_id,
      montant: pret.montant.toString(),
      echeance: pret.echeance,
      notes: pret.notes || ""
    });
    setShowAddDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Prêts</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les prêts accordés aux membres (Taux: 5%, Remboursement: 2 mois)
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedPret(null);
              setFormData({ membre_id: "", montant: "", echeance: "", notes: "" });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Prêt
            </Button>
          </DialogTrigger>
          <PretForm 
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            pret={selectedPret}
            onSuccess={fetchPrets}
          />
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prêts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prets.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Cours</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {prets.filter(p => p.statut === 'en_cours').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remboursés</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {prets.filter(p => p.statut === 'rembourse').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Retard</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {prets.filter(p => p.statut === 'en_retard').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des prêts */}
      <div className="grid gap-4">
        {prets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Aucun prêt enregistré</p>
              <p className="text-sm text-muted-foreground">Ajoutez le premier prêt pour commencer</p>
            </CardContent>
          </Card>
        ) : (
          prets.map((pret) => (
            <Card key={pret.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {pret.membres?.prenom} {pret.membres?.nom}
                    </CardTitle>
                    <CardDescription>
                      Prêt du {format(new Date(pret.date_pret), "dd MMMM yyyy", { locale: fr })}
                    </CardDescription>
                  </div>
                  <Badge className={getStatutColor(pret.statut)}>
                    {getStatutLabel(pret.statut)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Montant</p>
                    <p className="font-semibold">{pret.montant.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Échéance</p>
                    <p className="font-semibold">
                      {format(new Date(pret.echeance), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taux d'intérêt</p>
                    <p className="font-semibold">{pret.taux_interet}%</p>
                  </div>
                </div>
                
                {pret.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{pret.notes}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedPret(pret);
                    setShowAddDialog(true);
                  }}>
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}