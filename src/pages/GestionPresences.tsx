import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck, Users, Plus, Calendar, Target, Search, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LogoHeader from "@/components/LogoHeader";

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  est_membre_e2d: boolean;
  est_adherent_phoenix: boolean;
}

interface Presence {
  id: string;
  membre_id: string;
  date_seance: string;
  type_seance: string;
  present: boolean;
  notes?: string;
  membre?: Membre;
}

interface Seance {
  id: string;
  date: string;
  type: string;
  titre: string;
}

export default function GestionPresences() {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedType, setSelectedType] = useState<string>("entrainement_e2d");
  const [showNewSeanceDialog, setShowNewSeanceDialog] = useState(false);
  const { toast } = useToast();

  const [newSeanceData, setNewSeanceData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: "entrainement_e2d",
    titre: ""
  });

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedType]);

  const loadData = async () => {
    try {
      const [membresData, presencesData, seancesData] = await Promise.all([
        // Charger les membres selon le type sélectionné
        selectedType === "entrainement_e2d" 
          ? supabase.from('membres').select('*').eq('est_membre_e2d', true).eq('statut', 'actif')
          : supabase.from('membres').select('*').eq('est_adherent_phoenix', true).eq('statut', 'actif'),
        
        // Charger les présences pour la date et le type sélectionnés
        supabase
          .from('sport_e2d_presences')
          .select(`
            *,
            membre:membres(id, nom, prenom, est_membre_e2d, est_adherent_phoenix)
          `)
          .eq('date_seance', selectedDate)
          .eq('type_seance', selectedType),
        
        // Charger les séances existantes
        supabase
          .from('sport_e2d_presences')
          .select('date_seance, type_seance')
          .order('date_seance', { ascending: false })
      ]);

      if (membresData.error) throw membresData.error;
      if (presencesData.error) throw presencesData.error;

      setMembres(membresData.data || []);
      setPresences(presencesData.data || []);

      // Créer la liste des séances uniques
      if (seancesData.data) {
        const uniqueSeances = seancesData.data.reduce((acc: Seance[], curr) => {
          const key = `${curr.date_seance}-${curr.type_seance}`;
          if (!acc.find(s => `${s.date}-${s.type}` === key)) {
            acc.push({
              id: key,
              date: curr.date_seance,
              type: curr.type_seance,
              titre: `${curr.type_seance === 'entrainement_e2d' ? 'Entraînement E2D' : 'Entraînement Phoenix'} - ${format(new Date(curr.date_seance), 'dd/MM/yyyy', { locale: fr })}`
            });
          }
          return acc;
        }, []);
        setSeances(uniqueSeances);
      }

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePresenceToggle = async (membreId: string, present: boolean) => {
    try {
      const existingPresence = presences.find(p => p.membre_id === membreId);

      if (existingPresence) {
        // Mettre à jour la présence existante
        const { error } = await supabase
          .from('sport_e2d_presences')
          .update({ present })
          .eq('id', existingPresence.id);

        if (error) throw error;
      } else {
        // Créer une nouvelle présence
        const { error } = await supabase
          .from('sport_e2d_presences')
          .insert([{
            membre_id: membreId,
            date_seance: selectedDate,
            type_seance: selectedType,
            present
          }]);

        if (error) throw error;
      }

      // Recharger les données
      loadData();

      toast({
        title: "Succès",
        description: "Présence mise à jour",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la présence: " + error.message,
        variant: "destructive",
      });
    }
  };

  const createNewSeance = async () => {
    try {
      // Créer des présences pour tous les membres avec statut "absent" par défaut
      const presencesData = membres.map(membre => ({
        membre_id: membre.id,
        date_seance: newSeanceData.date,
        type_seance: newSeanceData.type,
        present: false
      }));

      const { error } = await supabase
        .from('sport_e2d_presences')
        .insert(presencesData);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Nouvelle séance créée",
      });

      setShowNewSeanceDialog(false);
      setSelectedDate(newSeanceData.date);
      setSelectedType(newSeanceData.type);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la séance: " + error.message,
        variant: "destructive",
      });
    }
  };

  const filteredMembres = membres.filter(membre =>
    `${membre.nom} ${membre.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPresenceForMember = (membreId: string) => {
    return presences.find(p => p.membre_id === membreId);
  };

  const presentCount = presences.filter(p => p.present).length;
  const absentCount = presences.filter(p => !p.present).length;
  const totalMembers = membres.length;
  const attendanceRate = totalMembers > 0 ? (presentCount / totalMembers * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Gestion des Présences"
        subtitle="Suivi des présences aux entraînements et matchs"
      />

      {/* Contrôles de date et type */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Présences
            </CardTitle>
            <div className="flex gap-4 items-center">
              <div>
                <label className="text-sm font-medium">Date:</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="ml-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type:</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="ml-2 w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrainement_e2d">Entraînement E2D</SelectItem>
                    <SelectItem value="entrainement_phoenix">Entraînement Phoenix</SelectItem>
                    <SelectItem value="match_e2d">Match E2D</SelectItem>
                    <SelectItem value="match_phoenix">Match Phoenix</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={showNewSeanceDialog} onOpenChange={setShowNewSeanceDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle séance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une nouvelle séance</DialogTitle>
                    <DialogDescription>
                      Créez une nouvelle séance d'entraînement ou de match
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Date</label>
                      <Input
                        type="date"
                        value={newSeanceData.date}
                        onChange={(e) => setNewSeanceData(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <Select 
                        value={newSeanceData.type} 
                        onValueChange={(value) => setNewSeanceData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrainement_e2d">Entraînement E2D</SelectItem>
                          <SelectItem value="entrainement_phoenix">Entraînement Phoenix</SelectItem>
                          <SelectItem value="match_e2d">Match E2D</SelectItem>
                          <SelectItem value="match_phoenix">Match Phoenix</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowNewSeanceDialog(false)}>
                        Annuler
                      </Button>
                      <Button onClick={createNewSeance}>
                        Créer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistiques */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Membres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success">Présents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{presentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive">Absents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{absentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary">Taux de Présence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{attendanceRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des présences */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {selectedType === 'entrainement_e2d' ? 'Entraînement E2D' : 
               selectedType === 'entrainement_phoenix' ? 'Entraînement Phoenix' :
               selectedType === 'match_e2d' ? 'Match E2D' : 'Match Phoenix'} - {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: fr })}
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un membre..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membre</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembres.map((membre) => {
                const presence = getPresenceForMember(membre.id);
                const isPresent = presence?.present || false;

                return (
                  <TableRow key={membre.id}>
                    <TableCell className="font-medium">
                      {membre.nom} {membre.prenom}
                    </TableCell>
                    <TableCell>
                      {isPresent ? (
                        <Badge className="bg-success text-success-foreground">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Présent
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive text-destructive-foreground">
                          <XCircle className="w-3 h-3 mr-1" />
                          Absent
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={isPresent ? "outline" : "default"}
                          onClick={() => handlePresenceToggle(membre.id, true)}
                          disabled={isPresent}
                        >
                          Marquer présent
                        </Button>
                        <Button
                          size="sm"
                          variant={!isPresent ? "outline" : "default"}
                          onClick={() => handlePresenceToggle(membre.id, false)}
                          disabled={!isPresent}
                        >
                          Marquer absent
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Historique des séances récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Séances récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {seances.slice(0, 5).map((seance) => (
              <div key={seance.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{seance.titre}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(seance.date);
                    setSelectedType(seance.type);
                  }}
                >
                  Voir
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}