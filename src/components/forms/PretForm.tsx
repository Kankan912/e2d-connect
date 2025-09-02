import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { addMonths, format } from "date-fns";

interface Membre {
  id: string;
  nom: string;
  prenom: string;
}

interface PretFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pret?: any | null;
  onSuccess: () => void;
}

export default function PretForm({ open, onOpenChange, pret, onSuccess }: PretFormProps) {
  const [formData, setFormData] = useState({
    membre_id: "",
    avaliste_id: "",
    montant: "",
    notes: ""
  });
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Calculer automatiquement la date d'échéance (2 mois)
  const datePret = new Date();
  const dateEcheance = addMonths(datePret, 2);

  useEffect(() => {
    if (open) {
      fetchMembres();
      if (pret) {
        setFormData({
          membre_id: pret.membre_id || "",
          avaliste_id: pret.avaliste_id || "",
          montant: pret.montant?.toString() || "",
          notes: pret.notes || ""
        });
      } else {
        setFormData({
          membre_id: "",
          avaliste_id: "",
          montant: "",
          notes: ""
        });
      }
    }
  }, [open, pret]);

  const fetchMembres = async () => {
    try {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .eq('est_membre_e2d', true)
        .order('nom');

      if (error) throw error;
      setMembres(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.membre_id || !formData.montant) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (formData.membre_id === formData.avaliste_id) {
      toast({
        title: "Erreur",
        description: "L'avaliste ne peut pas être le même que le bénéficiaire",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const pretData = {
        membre_id: formData.membre_id,
        avaliste_id: formData.avaliste_id || null,
        montant: parseFloat(formData.montant),
        date_pret: format(datePret, 'yyyy-MM-dd'),
        echeance: format(dateEcheance, 'yyyy-MM-dd'),
        notes: formData.notes || null,
        taux_interet: 5.0,
        statut: 'en_cours'
      };

      if (pret?.id) {
        const { error } = await supabase
          .from('prets')
          .update(pretData)
          .eq('id', pret.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('prets')
          .insert([pretData]);
        
        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: pret?.id ? "Prêt modifié avec succès" : "Prêt ajouté avec succès",
      });

      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setFormData({
        membre_id: "",
        avaliste_id: "",
        montant: "",
        notes: ""
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message.includes('duplicate') 
          ? "Ce membre a déjà un prêt en cours" 
          : "Impossible d'enregistrer le prêt",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {pret?.id ? "Modifier le prêt" : "Nouveau prêt"}
          </DialogTitle>
          <DialogDescription>
            Prêt avec taux d'intérêt de 5% et échéance automatique de 2 mois ({format(dateEcheance, 'dd/MM/yyyy')})
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="membre">Bénéficiaire *</Label>
            <Select value={formData.membre_id} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, membre_id: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le bénéficiaire" />
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
            <Label htmlFor="avaliste">Avaliste</Label>
            <Select value={formData.avaliste_id || ''} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, avaliste_id: value === 'none' ? '' : value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner l'avaliste (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun avaliste</SelectItem>
                {membres
                  .filter(m => m.id !== formData.membre_id)
                  .map((membre) => (
                    <SelectItem key={membre.id} value={membre.id}>
                      {membre.prenom} {membre.nom}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              L'avaliste garantit le remboursement du prêt
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (FCFA) *</Label>
            <Input
              id="montant"
              type="number"
              placeholder="Ex: 50000"
              value={formData.montant}
              onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
              required
            />
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Date du prêt:</span>
              <span className="font-medium">{format(datePret, 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Date d'échéance:</span>
              <span className="font-medium text-warning">{format(dateEcheance, 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Taux d'intérêt:</span>
              <span className="font-medium">5% / 2 mois</span>
            </div>
            {formData.montant && (
              <div className="flex justify-between text-sm font-bold border-t pt-2">
                <span>Montant à rembourser:</span>
                <span className="text-primary">
                  {(parseFloat(formData.montant) * 1.05).toLocaleString()} FCFA
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Notes additionnelles sur le prêt..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : pret?.id ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}