import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Plus, Users, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Entrainement {
  id: string;
  date_entrainement: string;
  heure_debut: string;
  heure_fin: string;
  lieu: string;
  type_entrainement: string;
  notes: string;
}

interface Presence {
  id: string;
  entrainement_id: string;
  membre_id: string;
  present: boolean;
  retard_minutes: number;
  excuse: string;
  membres: {
    nom: string;
    prenom: string;
  };
}

export default function PhoenixEntrainementsManager() {
  const [showForm, setShowForm] = useState(false);
  const [selectedEntrainement, setSelectedEntrainement] = useState<Entrainement | null>(null);
  const [showPresences, setShowPresences] = useState(false);
  const [formData, setFormData] = useState({
    date_entrainement: "",
    heure_debut: "",
    heure_fin: "",
    lieu: "",
    type_entrainement: "normal",
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: entrainements } = useQuery({
    queryKey: ['phoenix-entrainements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phoenix_entrainements' as any)
        .select('*')
        .order('date_entrainement', { ascending: false });
      if (error) throw error;
      return data as any;
    }
  });

  const { data: adherents } = useQuery({
    queryKey: ['phoenix-adherents-entrainements'],
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

  const { data: presences } = useQuery({
    queryKey: ['phoenix-presences-entrainement', selectedEntrainement?.id],
    queryFn: async () => {
      if (!selectedEntrainement?.id) return [];
      const { data, error } = await supabase
        .from('phoenix_presences_entrainement' as any)
        .select(`
          *,
          membres:membre_id (
            nom,
            prenom
          )
        `)
        .eq('entrainement_id', selectedEntrainement.id);
      if (error) throw error;
      return data as any;
    },
    enabled: !!selectedEntrainement?.id
  });

  const createEntrainementMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('phoenix_entrainements' as any)
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoenix-entrainements'] });
      toast.success("Entraînement créé avec succès");
      resetForm();
    }
  });

  const updatePresenceMutation = useMutation({
    mutationFn: async (data: { entrainement_id: string; membre_id: string; present: boolean; retard_minutes?: number; excuse?: string }) => {
      const { error } = await supabase
        .from('phoenix_presences_entrainement' as any)
        .upsert([data], { onConflict: 'entrainement_id,membre_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phoenix-presences-entrainement'] });
      toast.success("Présence mise à jour");
    }
  });

  const resetForm = () => {
    setFormData({
      date_entrainement: "",
      heure_debut: "",
      heure_fin: "",
      lieu: "",
      type_entrainement: "normal",
      notes: ""
    });
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEntrainementMutation.mutate(formData);
  };

  const handlePresenceChange = (membre_id: string, present: boolean) => {
    updatePresenceMutation.mutate({
      entrainement_id: selectedEntrainement!.id,
      membre_id,
      present
    });
  };

  const getPresenceStats = () => {
    if (!presences) return { presents: 0, absents: 0, total: 0 };
    const presents = presences.filter(p => p.present).length;
    const total = presences.length;
    return {
      presents,
      absents: total - presents,
      total
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Entraînements Phoenix</h2>
          <p className="text-muted-foreground">Planifiez et gérez les présences</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel entraînement
        </Button>
      </div>

      <div className="grid gap-4">
        {entrainements?.map((entrainement) => (
          <Card key={entrainement.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Entraînement du {new Date(entrainement.date_entrainement).toLocaleDateString()}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant={entrainement.type_entrainement === 'normal' ? 'default' : 'secondary'}>
                    {entrainement.type_entrainement}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedEntrainement(entrainement);
                      setShowPresences(true);
                    }}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Présences
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {entrainement.heure_debut}
                  {entrainement.heure_fin && ` - ${entrainement.heure_fin}`}
                </div>
                {entrainement.lieu && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {entrainement.lieu}
                  </div>
                )}
                {entrainement.notes && (
                  <p className="text-muted-foreground mt-2">{entrainement.notes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog pour créer un entraînement */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel entraînement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date_entrainement}
                onChange={(e) => setFormData(prev => ({ ...prev, date_entrainement: e.target.value }))}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Heure début</Label>
                <Input
                  type="time"
                  value={formData.heure_debut}
                  onChange={(e) => setFormData(prev => ({ ...prev, heure_debut: e.target.value }))}
                />
              </div>
              <div>
                <Label>Heure fin</Label>
                <Input
                  type="time"
                  value={formData.heure_fin}
                  onChange={(e) => setFormData(prev => ({ ...prev, heure_fin: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Lieu</Label>
              <Input
                value={formData.lieu}
                onChange={(e) => setFormData(prev => ({ ...prev, lieu: e.target.value }))}
                placeholder="Stade, gymnase..."
              />
            </div>

            <div>
              <Label>Type d'entraînement</Label>
              <Select
                value={formData.type_entrainement}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type_entrainement: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="intensif">Intensif</SelectItem>
                  <SelectItem value="technique">Technique</SelectItem>
                  <SelectItem value="physique">Physique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Objectifs, exercices prévus..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                Annuler
              </Button>
              <Button type="submit" disabled={createEntrainementMutation.isPending}>
                Créer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog pour les présences */}
      <Dialog open={showPresences} onOpenChange={setShowPresences}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Présences - {selectedEntrainement && new Date(selectedEntrainement.date_entrainement).toLocaleDateString()}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEntrainement && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Présents: {getPresenceStats().presents}
                </Badge>
                <Badge variant="outline" className="text-red-600">
                  <XCircle className="w-3 h-3 mr-1" />
                  Absents: {getPresenceStats().absents}
                </Badge>
              </div>

              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {adherents?.map((membre: any) => {
                  const presence = presences?.find(p => p.membre_id === membre.id);
                  return (
                    <div key={membre.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{membre.prenom} {membre.nom}</span>
                      <div className="flex gap-2">
                        <Button
                          variant={presence?.present ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePresenceChange(membre.id, true)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={presence?.present === false ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => handlePresenceChange(membre.id, false)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}