import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Users, 
  Check, 
  X, 
  Search,
  Calendar,
  UserCheck,
  UserX
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogoHeader from "@/components/LogoHeader";
import { useBackNavigation } from "@/hooks/useBackNavigation";

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  statut: string;
}

interface Reunion {
  id: string;
  date_reunion: string;
  statut: string;
  ordre_du_jour: string;
}

interface Presence {
  id: string;
  reunion_id: string;
  membre_id: string;
  present: boolean;
  notes?: string;
}

export default function PresenceReunions() {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [reunions, setReunions] = useState<Reunion[]>([]);
  const [presences, setPresences] = useState<Presence[]>([]);
  const [selectedReunion, setSelectedReunion] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { goBack, BackIcon } = useBackNavigation();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedReunion) {
      loadPresences();
    }
  }, [selectedReunion]);

  const loadData = async () => {
    try {
      // Charger tous les membres actifs
      const { data: membresData, error: membresError } = await supabase
        .from('membres')
        .select('id, nom, prenom, statut')
        .eq('statut', 'actif')
        .order('nom');

      if (membresError) throw membresError;

      // Charger toutes les réunions
      const { data: reunionsData, error: reunionsError } = await supabase
        .from('reunions')
        .select('id, date_reunion, statut, ordre_du_jour')
        .order('date_reunion', { ascending: false });

      if (reunionsError) throw reunionsError;

      setMembres(membresData || []);
      setReunions(reunionsData || []);
      
      // Sélectionner automatiquement la première réunion
      if (reunionsData && reunionsData.length > 0) {
        setSelectedReunion(reunionsData[0].id);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPresences = async () => {
    if (!selectedReunion) return;

    try {
      const { data, error } = await supabase
        .from('reunion_presences')
        .select('*')
        .eq('reunion_id', selectedReunion);

      if (error) throw error;
      setPresences(data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des présences:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les présences: " + error.message,
        variant: "destructive",
      });
    }
  };

  const togglePresence = async (membreId: string, isPresent: boolean) => {
    if (!selectedReunion) return;

    try {
      const existingPresence = presences.find(
        p => p.membre_id === membreId && p.reunion_id === selectedReunion
      );

      if (existingPresence) {
        // Mettre à jour
        const { error } = await supabase
          .from('reunion_presences')
          .update({ present: isPresent })
          .eq('id', existingPresence.id);

        if (error) throw error;
      } else {
        // Créer
        const { error } = await supabase
          .from('reunion_presences')
          .insert({
            reunion_id: selectedReunion,
            membre_id: membreId,
            present: isPresent
          });

        if (error) throw error;
      }

      await loadPresences();
      toast({
        title: "Succès",
        description: `Présence ${isPresent ? 'confirmée' : 'marquée comme absente'}`,
      });
    } catch (error: any) {
      console.error('Erreur lors de la modification de la présence:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier la présence: " + error.message,
        variant: "destructive",
      });
    }
  };

  const isPresent = (membreId: string): boolean => {
    const presence = presences.find(
      p => p.membre_id === membreId && p.reunion_id === selectedReunion
    );
    return presence?.present || false;
  };

  const hasPresenceRecord = (membreId: string): boolean => {
    return presences.some(
      p => p.membre_id === membreId && p.reunion_id === selectedReunion
    );
  };

  const filteredMembres = membres.filter(membre =>
    `${membre.nom} ${membre.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedReunionData = reunions.find(r => r.id === selectedReunion);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = "primary" 
  }: {
    title: string;
    value: string | number;
    icon: any;
    color?: string;
  }) => (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 text-${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <LogoHeader 
          title="Présences aux Réunions"
          subtitle="Gestion des présences aux séances de réunions mensuelles"
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalPresents = presences.filter(p => p.present && p.reunion_id === selectedReunion).length;
  const totalAbsents = presences.filter(p => !p.present && p.reunion_id === selectedReunion).length;
  const tauxPresence = membres.length > 0 ? Math.round((totalPresents / membres.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={goBack}>
            <BackIcon className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <LogoHeader 
            title="Présences aux Réunions"
            subtitle="Gestion des présences aux séances de réunions mensuelles"
          />
        </div>
      </div>

      {/* Sélection de la réunion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sélectionner une réunion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <select
              value={selectedReunion}
              onChange={(e) => setSelectedReunion(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Sélectionner une réunion</option>
              {reunions.map((reunion) => (
                <option key={reunion.id} value={reunion.id}>
                  {new Date(reunion.date_reunion).toLocaleDateString('fr-FR')} - {reunion.ordre_du_jour || 'Réunion'}
                </option>
              ))}
            </select>
            
            {selectedReunionData && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold">Réunion sélectionnée</h3>
                <p className="text-sm text-muted-foreground">
                  Date: {new Date(selectedReunionData.date_reunion).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Ordre du jour: {selectedReunionData.ordre_du_jour || 'Non défini'}
                </p>
                <Badge variant={selectedReunionData.statut === 'terminee' ? 'default' : 'secondary'}>
                  {selectedReunionData.statut}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedReunion && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Membres"
              value={membres.length}
              icon={Users}
              color="primary"
            />
            <StatCard
              title="Présents"
              value={totalPresents}
              icon={UserCheck}
              color="success"
            />
            <StatCard
              title="Absents"
              value={totalAbsents}
              icon={UserX}
              color="destructive"
            />
            <StatCard
              title="Taux Présence"
              value={`${tauxPresence}%`}
              icon={Users}
              color="warning"
            />
          </div>

          {/* Liste des présences */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Feuille de Présence
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membre</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Présence</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembres.map((membre) => {
                      const present = isPresent(membre.id);
                      const hasRecord = hasPresenceRecord(membre.id);
                      
                      return (
                        <TableRow key={membre.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {membre.prenom} {membre.nom}
                          </TableCell>
                          
                          <TableCell>
                            <Badge variant="outline">
                              {membre.statut}
                            </Badge>
                          </TableCell>
                          
                          <TableCell>
                            {hasRecord ? (
                              present ? (
                                <Badge className="bg-success text-success-foreground">
                                  <Check className="w-3 h-3 mr-1" />
                                  Présent
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <X className="w-3 h-3 mr-1" />
                                  Absent
                                </Badge>
                              )
                            ) : (
                              <Badge variant="outline">Non marqué</Badge>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => togglePresence(membre.id, true)}
                                className={present ? "bg-success text-success-foreground" : ""}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => togglePresence(membre.id, false)}
                                className={hasRecord && !present ? "bg-destructive text-destructive-foreground" : ""}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {filteredMembres.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "Aucun membre trouvé" : "Aucun membre disponible"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}