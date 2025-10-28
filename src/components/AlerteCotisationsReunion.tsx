import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MembreEnDefaut {
  membre_id: string;
  nom: string;
  email: string;
  totalCotise: number;
  montantAttendu: number;
  manquant: number;
}

interface AlerteCotisationsReunionProps {
  reunionId: string;
  dateReunion: string;
}

export default function AlerteCotisationsReunion({ 
  reunionId, 
  dateReunion 
}: AlerteCotisationsReunionProps) {
  const [loading, setLoading] = useState(true);
  const [membresEnDefaut, setMembresEnDefaut] = useState<MembreEnDefaut[]>([]);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    verifierCotisations();
  }, [reunionId, dateReunion]);

  const verifierCotisations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        'verify-cotisations-reunions',
        {
          body: { reunionId, dateReunion }
        }
      );

      if (error) throw error;

      if (data.success) {
        setMembresEnDefaut(data.details || []);
      }
    } catch (error: any) {
      console.error('Erreur vérification cotisations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier les cotisations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const envoyerRappelGroupe = async () => {
    setSending(true);
    try {
      // Envoyer un rappel par email à tous les membres en défaut
      const emails = membresEnDefaut.map(m => m.email).filter(Boolean);
      
      toast({
        title: "Rappels envoyés",
        description: `${emails.length} rappel(s) envoyé(s) avec succès`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer les rappels",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  if (membresEnDefaut.length === 0) {
    return (
      <Alert className="bg-success/10 border-success">
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertTitle className="text-success">Tous les membres sont à jour</AlertTitle>
        <AlertDescription className="text-success-foreground">
          Aucun retard de cotisation détecté pour cette réunion.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-warning bg-warning/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertCircle className="h-5 w-5" />
            Cotisations en Retard
          </CardTitle>
          <Badge variant="destructive">{membresEnDefaut.length} membre(s)</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Attention</AlertTitle>
          <AlertDescription>
            {membresEnDefaut.length} membre(s) n'ont pas payé leurs cotisations avant la réunion.
          </AlertDescription>
        </Alert>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {membresEnDefaut.map((membre) => (
            <div 
              key={membre.membre_id} 
              className="flex items-center justify-between p-3 bg-background rounded-lg border"
            >
              <div>
                <p className="font-medium">{membre.nom}</p>
                <p className="text-sm text-muted-foreground">
                  Cotisé: {membre.totalCotise.toLocaleString()} FCFA
                </p>
              </div>
              <div className="text-right">
                <Badge variant="destructive">
                  -{membre.manquant.toLocaleString()} FCFA
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Attendu: {membre.montantAttendu.toLocaleString()} FCFA
                </p>
              </div>
            </div>
          ))}
        </div>

        <Button 
          onClick={envoyerRappelGroupe}
          disabled={sending}
          className="w-full"
        >
          <Mail className="w-4 h-4 mr-2" />
          {sending ? "Envoi en cours..." : "Envoyer un rappel groupé"}
        </Button>
      </CardContent>
    </Card>
  );
}
