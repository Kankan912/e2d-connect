import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useEnsureAdmin() {
  const { toast } = useToast();

  const ensureAdmin = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('ensure-admin');
      if (error) {
        console.error('Erreur ensure-admin:', error);
        toast({
          title: "Erreur d'autorisation",
          description: "Impossible de vérifier les droits administrateur.",
          variant: "destructive",
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erreur ensure-admin:', error);
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
      return await operation();
    } catch (error: any) {
      if (retryOnce && (error.message?.includes('403') || error.code === 'PGRST301')) {
        const adminEnsured = await ensureAdmin();
        if (adminEnsured) {
          try {
            return await operation();
          } catch (retryError) {
            console.error('Retry failed after ensure-admin:', retryError);
            throw retryError;
          }
        }
      }
      throw error;
    }
  }, [ensureAdmin]);

  return { ensureAdmin, withEnsureAdmin };
}