import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Users,
  Edit,
  Download
} from 'lucide-react';

interface Reunion {
  id: string;
  date_reunion: string;
  ordre_du_jour: string;
  lieu_description: string;
  compte_rendu_url?: string;
  statut: string;
}

interface RapportSeance {
  id: string;
  sujet: string;
  resolution: string | null;
}

interface CompteRenduViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reunion: Reunion | null;
  onEdit: () => void;
}

export default function CompteRenduViewer({ 
  open, 
  onOpenChange, 
  reunion, 
  onEdit 
}: CompteRenduViewerProps) {
  const [rapports, setRapports] = useState<RapportSeance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRapports = async () => {
      if (!reunion?.id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('rapports_seances')
          .select('id, sujet, resolution')
          .eq('reunion_id', reunion.id)
          .order('created_at');

        if (error) throw error;
        setRapports(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des rapports:', error);
        setRapports([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      loadRapports();
    }
  }, [reunion?.id, open]);

  const handleDownload = () => {
    if (reunion.compte_rendu_url && reunion.compte_rendu_url !== 'generated') {
      window.open(reunion.compte_rendu_url, '_blank');
    }
  };

  const hasCompteRendu = rapports.length > 0;

  if (!reunion) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compte-rendu de réunion
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meeting Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de la réunion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(reunion.date_reunion).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={reunion.statut === 'terminee' ? 'default' : 'secondary'}>
                    {reunion.statut}
                  </Badge>
                </div>

                {reunion.lieu_description && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{reunion.lieu_description}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Ordre du jour</h4>
                <p className="text-sm text-muted-foreground">
                  {reunion.ordre_du_jour || 'Non défini'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Compte-rendu Content */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Compte-rendu de la réunion</CardTitle>
              <div className="flex items-center gap-2">
                {hasCompteRendu ? (
                  <Badge className="bg-success text-success-foreground">
                    <FileText className="h-3 w-3 mr-1" />
                    Disponible
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <FileText className="h-3 w-3 mr-1" />
                    Non disponible
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Chargement du compte-rendu...
                </div>
              ) : hasCompteRendu ? (
                <div className="space-y-4">
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead>Sujet traité</TableHead>
                          <TableHead>Résolution / Décision</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rapports.map((rapport, index) => (
                          <TableRow key={rapport.id}>
                            <TableCell className="font-medium">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              {rapport.sujet}
                            </TableCell>
                            <TableCell>
                              {rapport.resolution || 'Aucune résolution enregistrée'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button onClick={onEdit} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier le compte-rendu
                    </Button>
                    
                    {reunion.compte_rendu_url && reunion.compte_rendu_url !== 'generated' && (
                      <Button onClick={handleDownload} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="text-muted-foreground">
                    Aucun compte-rendu disponible pour cette réunion
                  </div>
                  
                  <Button onClick={onEdit}>
                    <FileText className="h-4 w-4 mr-2" />
                    Créer le compte-rendu
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}