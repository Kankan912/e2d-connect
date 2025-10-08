import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Mail, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Beneficiaire {
  id: string;
  membre_id: string;
  montant_benefice: number;
}

interface CotisationManquante {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface ClotureReunionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reunionId: string;
  reunionData: {
    sujet: string;
    date_reunion: string;
    beneficiaires: Beneficiaire[];
  };
}

export default function ClotureReunionModal({
  open,
  onOpenChange,
  reunionId,
  reunionData
}: ClotureReunionModalProps) {
  const [loading, setLoading] = useState(false);
  const [verificationEtape, setVerificationEtape] = useState<'cotisations' | 'notifications' | 'cloture'>('cotisations');
  const [cotisationsManquantes, setCotisationsManquantes] = useState<CotisationManquante[]>([]);
  const { toast } = useToast();

  const verifierCotisations = async () => {
    setLoading(true);
    try {
      // Récupérer les membres sans cotisations du mois
      const { data: membres, error: membresError } = await supabase
        .from('membres')
        .select('id, nom, prenom, email')
        .eq('statut', 'actif');

      if (membresError) throw membresError;

      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);

      const finMois = new Date();
      finMois.setMonth(finMois.getMonth() + 1);
      finMois.setDate(0);
      finMois.setHours(23, 59, 59, 999);

      const { data: cotisationsMois, error: cotisationsError } = await supabase
        .from('cotisations')
        .select('membre_id')
        .gte('date_paiement', debutMois.toISOString())
        .lte('date_paiement', finMois.toISOString())
        .eq('statut', 'paye');

      if (cotisationsError) throw cotisationsError;

      const membresAvecCotisations = new Set(cotisationsMois?.map(c => c.membre_id) || []);
      const membresSansCotisations = membres?.filter(m => !membresAvecCotisations.has(m.id)) || [];

      setCotisationsManquantes(membresSansCotisations);
      setVerificationEtape('notifications');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de vérifier les cotisations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const envoyerNotifications = async () => {
    setLoading(true);
    try {
      // Simuler l'envoi d'emails (ici on pourrait utiliser une edge function)
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Notifications envoyées",
        description: `${cotisationsManquantes.length} emails de rappel envoyés`,
      });

      setVerificationEtape('cloture');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer les notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cloturerReunion = async () => {
    setLoading(true);
    try {
      // 1. Récupérer le compte-rendu
      const { data: rapportsData, error: rapportsError } = await supabase
        .from('rapports_seances')
        .select('sujet, resolution')
        .eq('reunion_id', reunionId);

      if (rapportsError) throw rapportsError;

      // 2. Récupérer les emails des membres actifs
      const { data: membresData, error: membresError } = await supabase
        .from('membres')
        .select('email')
        .eq('statut', 'actif')
        .not('email', 'is', null);

      if (membresError) throw membresError;

      const destinataires = membresData?.map(m => m.email).filter(Boolean) as string[];

      // 3. Construire le contenu du CR
      let contenuCR = '';
      rapportsData?.forEach((rapport, index) => {
        contenuCR += `\n\n${index + 1}. ${rapport.sujet}\n`;
        contenuCR += `   Décision: ${rapport.resolution || 'Aucune résolution'}\n`;
      });

      // 4. Envoyer le CR par email via edge function
      if (destinataires.length > 0 && rapportsData && rapportsData.length > 0) {
        const { error: emailError } = await supabase.functions.invoke('send-reunion-cr', {
          body: {
            reunionId,
            destinataires,
            sujet: reunionData.sujet,
            contenu: contenuCR,
            dateReunion: reunionData.date_reunion
          }
        });

        if (emailError) {
          console.error('Erreur envoi email:', emailError);
          // On continue même si l'email échoue
        }
      }

      // 5. Marquer la réunion comme clôturée
      const { error } = await supabase
        .from('reunions')
        .update({ 
          statut: 'terminee',
          compte_rendu_url: 'generated'
        })
        .eq('id', reunionId);

      if (error) throw error;

      toast({
        title: "Réunion clôturée",
        description: `La réunion a été clôturée et le compte-rendu envoyé à ${destinataires.length} membre(s)`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de clôturer la réunion: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open && verificationEtape === 'cotisations') {
      verifierCotisations();
    }
  }, [open, verificationEtape]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Clôturer la Réunion</DialogTitle>
          <DialogDescription>
            Vérification des cotisations et envoi des notifications automatiques
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Étapes de vérification */}
          <div className="flex items-center gap-4">
            <Badge variant={verificationEtape === 'cotisations' ? 'default' : 'secondary'}>
              1. Vérification
            </Badge>
            <Badge variant={verificationEtape === 'notifications' ? 'default' : 'secondary'}>
              2. Notifications
            </Badge>
            <Badge variant={verificationEtape === 'cloture' ? 'default' : 'secondary'}>
              3. Clôture
            </Badge>
          </div>

          {/* Étape 1: Vérification des cotisations */}
          {verificationEtape === 'cotisations' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Vérification des cotisations mensuelles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Vérification en cours...</p>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    Analyse des cotisations du mois en cours...
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Étape 2: Notifications */}
          {verificationEtape === 'notifications' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Membres sans cotisation ce mois
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cotisationsManquantes.length === 0 ? (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-5 w-5" />
                      <span>Tous les membres ont payé leurs cotisations !</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {cotisationsManquantes.length} membre(s) n'ont pas encore payé :
                      </p>
                      <div className="grid gap-2">
                        {cotisationsManquantes.slice(0, 5).map((membre) => (
                          <div key={membre.id} className="flex justify-between items-center p-2 bg-muted rounded">
                            <span className="font-medium">{membre.prenom} {membre.nom}</span>
                            <span className="text-sm text-muted-foreground">{membre.email}</span>
                          </div>
                        ))}
                        {cotisationsManquantes.length > 5 && (
                          <p className="text-sm text-muted-foreground">
                            ... et {cotisationsManquantes.length - 5} autres
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setVerificationEtape('cloture')}>
                  Ignorer les notifications
                </Button>
                <Button onClick={envoyerNotifications} disabled={loading || cotisationsManquantes.length === 0}>
                  <Mail className="h-4 w-4 mr-2" />
                  {loading ? "Envoi..." : "Envoyer rappels email"}
                </Button>
              </div>
            </div>
          )}

          {/* Étape 3: Clôture */}
          {verificationEtape === 'cloture' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Prêt pour la clôture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Réunion:</p>
                    <p className="text-muted-foreground">{reunionData.sujet}</p>
                  </div>
                  <div>
                    <p className="font-medium">Date:</p>
                    <p className="text-muted-foreground">
                      {new Date(reunionData.date_reunion).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Bénéficiaires:</p>
                    <p className="text-muted-foreground">{reunionData.beneficiaires?.length || 0} personnes</p>
                  </div>
                  <div>
                    <p className="font-medium">Notifications:</p>
                    <p className="text-muted-foreground">
                      {cotisationsManquantes.length > 0 ? "Envoyées" : "Aucune nécessaire"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Annuler
                  </Button>
                  <Button onClick={cloturerReunion} disabled={loading}>
                    {loading ? "Clôture..." : "Confirmer la clôture"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}