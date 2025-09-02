import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Plus, Calendar, MapPin, Target, Users, Edit, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LogoHeader from "@/components/LogoHeader";

interface Match {
  id: string;
  date_match: string;
  heure_match?: string;
  equipe_adverse: string;
  lieu?: string;
  score_e2d?: number;
  score_adverse?: number;
  type_match: string;
  statut: string;
  notes?: string;
}

interface PhoenixMatch {
  id: string;
  date_match: string;
  heure_match?: string;
  equipe_adverse: string;
  lieu?: string;
  score_phoenix?: number;
  score_adverse?: number;
  type_match: string;
  statut: string;
  notes?: string;
}

export default function MatchResults() {
  const [e2dMatches, setE2dMatches] = useState<Match[]>([]);
  const [phoenixMatches, setPhoenixMatches] = useState<PhoenixMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showE2DDialog, setShowE2DDialog] = useState(false);
  const [showPhoenixDialog, setShowPhoenixDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedPhoenixMatch, setSelectedPhoenixMatch] = useState<PhoenixMatch | null>(null);
  const { toast } = useToast();

  const [e2dFormData, setE2dFormData] = useState({
    equipe_adverse: "",
    score_e2d: "",
    score_adverse: "",
    statut: "termine"
  });

  const [phoenixFormData, setPhoenixFormData] = useState({
    equipe_adverse: "",
    score_phoenix: "",
    score_adverse: "",
    statut: "termine"
  });

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const [e2dData, phoenixData] = await Promise.all([
        supabase
          .from('sport_e2d_matchs')
          .select('*')
          .order('date_match', { ascending: false }),
        supabase
          .from('sport_phoenix_matchs')
          .select('*')
          .order('date_match', { ascending: false })
      ]);

      if (e2dData.error) throw e2dData.error;
      if (phoenixData.error) throw phoenixData.error;

      setE2dMatches(e2dData.data || []);
      setPhoenixMatches(phoenixData.data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les matchs: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleE2DResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMatch) return;

    try {
      const { error } = await supabase
        .from('sport_e2d_matchs')
        .update({
          score_e2d: parseInt(e2dFormData.score_e2d),
          score_adverse: parseInt(e2dFormData.score_adverse),
          statut: e2dFormData.statut
        })
        .eq('id', selectedMatch.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Résultat du match E2D enregistré",
      });

      setShowE2DDialog(false);
      setSelectedMatch(null);
      loadMatches();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le résultat: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handlePhoenixResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPhoenixMatch) return;

    try {
      const { error } = await supabase
        .from('sport_phoenix_matchs')
        .update({
          score_phoenix: parseInt(phoenixFormData.score_phoenix),
          score_adverse: parseInt(phoenixFormData.score_adverse),
          statut: phoenixFormData.statut
        })
        .eq('id', selectedPhoenixMatch.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Résultat du match Phoenix enregistré",
      });

      setShowPhoenixDialog(false);
      setSelectedPhoenixMatch(null);
      loadMatches();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le résultat: " + error.message,
        variant: "destructive",
      });
    }
  };

  const getResultBadge = (scoreHome: number | null, scoreAway: number | null) => {
    if (scoreHome === null || scoreAway === null) {
      return <Badge variant="outline">À jouer</Badge>;
    }

    if (scoreHome > scoreAway) {
      return <Badge className="bg-success text-success-foreground">Victoire</Badge>;
    } else if (scoreHome < scoreAway) {
      return <Badge className="bg-destructive text-destructive-foreground">Défaite</Badge>;
    } else {
      return <Badge className="bg-warning text-warning-foreground">Nul</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const e2dStats = e2dMatches.reduce((acc, match) => {
    if (match.score_e2d !== null && match.score_adverse !== null) {
      acc.joues++;
      if (match.score_e2d > match.score_adverse) acc.victoires++;
      else if (match.score_e2d < match.score_adverse) acc.defaites++;
      else acc.nuls++;
    }
    return acc;
  }, { joues: 0, victoires: 0, defaites: 0, nuls: 0 });

  const phoenixStats = phoenixMatches.reduce((acc, match) => {
    if (match.score_phoenix !== null && match.score_adverse !== null) {
      acc.joues++;
      if (match.score_phoenix > match.score_adverse) acc.victoires++;
      else if (match.score_phoenix < match.score_adverse) acc.defaites++;
      else acc.nuls++;
    }
    return acc;
  }, { joues: 0, victoires: 0, defaites: 0, nuls: 0 });

  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Résultats des Matchs"
        subtitle="Gestion des résultats sportifs E2D et Phoenix"
      />

      <Tabs defaultValue="e2d" className="space-y-6">
        <TabsList>
          <TabsTrigger value="e2d">E2D Football</TabsTrigger>
          <TabsTrigger value="phoenix">Phoenix</TabsTrigger>
        </TabsList>

        <TabsContent value="e2d" className="space-y-6">
          {/* E2D Stats */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Matchs Joués</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{e2dStats.joues}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-success">Victoires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{e2dStats.victoires}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-destructive">Défaites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{e2dStats.defaites}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-warning">Nuls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{e2dStats.nuls}</div>
              </CardContent>
            </Card>
          </div>

          {/* E2D Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Matchs E2D
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Adversaire</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Résultat</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {e2dMatches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        {new Date(match.date_match).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        vs {match.equipe_adverse}
                      </TableCell>
                      <TableCell>
                        {match.score_e2d !== null && match.score_adverse !== null
                          ? `${match.score_e2d} - ${match.score_adverse}`
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {getResultBadge(match.score_e2d, match.score_adverse)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMatch(match);
                            setE2dFormData({
                              equipe_adverse: match.equipe_adverse,
                              score_e2d: match.score_e2d?.toString() || "",
                              score_adverse: match.score_adverse?.toString() || "",
                              statut: match.statut
                            });
                            setShowE2DDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Résultat
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phoenix" className="space-y-6">
          {/* Phoenix Stats */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Matchs Joués</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{phoenixStats.joues}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-success">Victoires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{phoenixStats.victoires}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-destructive">Défaites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{phoenixStats.defaites}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-warning">Nuls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{phoenixStats.nuls}</div>
              </CardContent>
            </Card>
          </div>

          {/* Phoenix Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Matchs Phoenix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Adversaire</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Résultat</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {phoenixMatches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        {new Date(match.date_match).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        vs {match.equipe_adverse}
                      </TableCell>
                      <TableCell>
                        {match.score_phoenix !== null && match.score_adverse !== null
                          ? `${match.score_phoenix} - ${match.score_adverse}`
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {getResultBadge(match.score_phoenix, match.score_adverse)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPhoenixMatch(match);
                            setPhoenixFormData({
                              equipe_adverse: match.equipe_adverse,
                              score_phoenix: match.score_phoenix?.toString() || "",
                              score_adverse: match.score_adverse?.toString() || "",
                              statut: match.statut
                            });
                            setShowPhoenixDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Résultat
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* E2D Result Dialog */}
      <Dialog open={showE2DDialog} onOpenChange={setShowE2DDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résultat du match E2D</DialogTitle>
            <DialogDescription>
              Enregistrez le résultat du match contre {selectedMatch?.equipe_adverse}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleE2DResultSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Score E2D</Label>
                <Input
                  type="number"
                  min="0"
                  value={e2dFormData.score_e2d}
                  onChange={(e) => setE2dFormData(prev => ({ ...prev, score_e2d: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Score Adversaire</Label>
                <Input
                  type="number"
                  min="0"
                  value={e2dFormData.score_adverse}
                  onChange={(e) => setE2dFormData(prev => ({ ...prev, score_adverse: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={e2dFormData.statut} onValueChange={(value) => setE2dFormData(prev => ({ ...prev, statut: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="termine">Terminé</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="reporte">Reporté</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowE2DDialog(false)}>
                Annuler
              </Button>
              <Button type="submit">
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Phoenix Result Dialog */}
      <Dialog open={showPhoenixDialog} onOpenChange={setShowPhoenixDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résultat du match Phoenix</DialogTitle>
            <DialogDescription>
              Enregistrez le résultat du match contre {selectedPhoenixMatch?.equipe_adverse}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePhoenixResultSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Score Phoenix</Label>
                <Input
                  type="number"
                  min="0"
                  value={phoenixFormData.score_phoenix}
                  onChange={(e) => setPhoenixFormData(prev => ({ ...prev, score_phoenix: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Score Adversaire</Label>
                <Input
                  type="number"
                  min="0"
                  value={phoenixFormData.score_adverse}
                  onChange={(e) => setPhoenixFormData(prev => ({ ...prev, score_adverse: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={phoenixFormData.statut} onValueChange={(value) => setPhoenixFormData(prev => ({ ...prev, statut: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="termine">Terminé</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="reporte">Reporté</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPhoenixDialog(false)}>
                Annuler
              </Button>
              <Button type="submit">
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}