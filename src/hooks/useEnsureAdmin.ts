
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useEnsureAdmin() {
  const { toast } = useToast();

  const ensureAdmin = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔧 Tentative ensure-admin...');
      const { error } = await supabase.functions.invoke('ensure-admin');
      if (error) {
        console.error('❌ Erreur ensure-admin:', error);
        toast({
          title: "Erreur d'autorisation",
          description: "Impossible de vérifier les droits administrateur.",
          variant: "destructive",
        });
        return false;
      }
      console.log('✅ ensure-admin réussi');
      toast({
        title: "Droits administrateur",
        description: "Accès administrateur confirmé.",
      });
      return true;
    } catch (error) {
      console.error('❌ Erreur ensure-admin:', error);
      toast({
        title: "Erreur d'autorisation",
        description: "Impossible de vérifier les droits administrateur.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const withEnsureAdmin = useCallback(async <T>(
    operation: () => Promise<T>,
    retryOnce = true
  ): Promise<T | null> => {
    try {
      console.log('🚀 Tentative opération...');
      return await operation();
    } catch (error: any) {
      console.log('❌ Erreur détectée:', error);
      
      // Détecter les erreurs RLS (code 42501) ou 403
      const isRLSError = error.code === '42501' || 
                        error.message?.includes('42501') ||
                        error.message?.includes('row-level security') ||
                        error.message?.includes('violates') ||
                        error.message?.includes('403') ||
                        error.code === 'PGRST301';

      if (retryOnce && isRLSError) {
        console.log('🔄 Erreur RLS détectée, tentative ensure-admin...');
        const adminEnsured = await ensureAdmin();
        if (adminEnsured) {
          try {
            console.log('🔄 Retry de l\'opération après ensure-admin...');
            return await operation();
          } catch (retryError) {
            console.error('❌ Retry échoué après ensure-admin:', retryError);
            throw retryError;
          }
        }
      }
      throw error;
    }
  }, [ensureAdmin]);

  return { ensureAdmin, withEnsureAdmin };
}
