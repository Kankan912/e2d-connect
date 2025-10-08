import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, DollarSign, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BeneficiaireHistorique {
  id: string;
  membre_id: string;
  montant_benefice: number;
  date_benefice_prevue: string;
  statut: string;
  reunion_id: string;
  created_at: string;
  membre: {
    nom: string;
    prenom: string;
  };
  reunion: {
    date_reunion: string;
    lieu_description: string;
  };
}

export default function HistoriqueBeneficiaires() {
  const [beneficiaires, setBeneficiaires] = useState<BeneficiaireHistorique[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadHistorique();
  }, []);

  const loadHistorique = async () => {
    try {
      const { data, error } = await supabase
        .from('reunion_beneficiaires')
        .select(`
          *,
          membre:membres!membre_id (
            nom,
            prenom
          ),
          reunion:reunions!reunion_id (
            date_reunion,
            lieu_description
          )
        `)
        .order('date_benefice_prevue', { ascending: false });

      if (error) throw error;
      setBeneficiaires(data as any || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'effectue':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Effectué</Badge>;
      case 'prevu':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Prévu</Badge>;
      case 'annule':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const totalDistribue = beneficiaires
    .filter(b => b.statut === 'effectue')
    .reduce((sum, b) => sum + Number(b.montant_benefice), 0);

  const totalPrevu = beneficiaires
    .filter(b => b.statut === 'prevu')
    .reduce((sum, b) => sum + Number(b.montant_benefice), 0);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Distribué</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalDistribue.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Prévu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalPrevu.toLocaleString()} FCFA
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nombre de Bénéficiaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {beneficiaires.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau historique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historique des Bénéficiaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Réunion</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date Prévue</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Lieu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beneficiaires.map((beneficiaire) => (
                <TableRow key={beneficiaire.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(beneficiaire.reunion.date_reunion), "dd MMM yyyy", { locale: fr })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {beneficiaire.membre.prenom} {beneficiaire.membre.nom}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-bold text-green-600">
                      <DollarSign className="h-4 w-4" />
                      {Number(beneficiaire.montant_benefice).toLocaleString()} FCFA
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(beneficiaire.date_benefice_prevue), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    {getStatutBadge(beneficiaire.statut)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {beneficiaire.reunion.lieu_description || '-'}
                  </TableCell>
                </TableRow>
              ))}
              {beneficiaires.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun historique de bénéficiaires
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
