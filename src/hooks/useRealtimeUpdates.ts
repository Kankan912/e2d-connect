import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeUpdatesProps {
  table: string;
  onUpdate?: () => void;
  enabled?: boolean;
}

export const useRealtimeUpdates = ({ table, onUpdate, enabled = true }: UseRealtimeUpdatesProps) => {
  useEffect(() => {
    if (!enabled || !onUpdate) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onUpdate, enabled]);
};