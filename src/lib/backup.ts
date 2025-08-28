import { supabase } from "@/integrations/supabase/client";

export interface BackupOptions {
  includeFiles?: boolean;
  tables?: string[];
  format?: 'json' | 'csv';
}

export interface BackupData {
  timestamp: string;
  version: string;
  tables: Record<string, any[]>;
  metadata: {
    totalRecords: number;
    backupSize: string;
    tables: string[];
  };
}

// Tailles approximatives en octets
const RECORD_SIZE_ESTIMATES = {
  membres: 500,
  cotisations: 300,
  prets: 400,
  aides: 350,
  sanctions: 400,
  epargnes: 250,
  reunions: 600,
  rapports_seances: 400
};

export const createBackup = async (options: BackupOptions = {}): Promise<BackupData> => {
  const {
    tables = [
      'membres', 'cotisations', 'prets', 'aides', 'sanctions', 
      'epargnes', 'reunions', 'rapports_seances', 'cotisations_types',
      'aides_types', 'sanctions_types', 'roles', 'membres_roles'
    ],
    format = 'json'
  } = options;

  const backupData: BackupData = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    tables: {},
    metadata: {
      totalRecords: 0,
      backupSize: '0 KB',
      tables: []
    }
  };

  let totalRecords = 0;
  let estimatedSize = 0;

  try {
    // Sauvegarder chaque table
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*');

        if (error) {
          console.warn(`Impossible de sauvegarder la table ${tableName}:`, error);
          continue;
        }

        if (data && data.length > 0) {
          backupData.tables[tableName] = data;
          backupData.metadata.tables.push(tableName);
          totalRecords += data.length;
          
          // Estimation de la taille
          const recordSize = RECORD_SIZE_ESTIMATES[tableName as keyof typeof RECORD_SIZE_ESTIMATES] || 300;
          estimatedSize += data.length * recordSize;
        }
      } catch (tableError) {
        console.warn(`Erreur lors de la sauvegarde de ${tableName}:`, tableError);
      }
    }

    backupData.metadata.totalRecords = totalRecords;
    backupData.metadata.backupSize = formatBytes(estimatedSize);

    return backupData;
  } catch (error) {
    throw new Error(`Erreur lors de la création de la sauvegarde: ${error}`);
  }
};

export const downloadBackup = (backupData: BackupData, filename?: string): void => {
  const defaultFilename = `e2d_backup_${new Date().toISOString().split('T')[0]}.json`;
  const finalFilename = filename || defaultFilename;

  const dataStr = JSON.stringify(backupData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const restoreFromBackup = async (backupData: BackupData, options: {
  clearExisting?: boolean;
  tables?: string[];
} = {}): Promise<{
  success: boolean;
  restored: Record<string, number>;
  errors: string[];
}> => {
  const { clearExisting = false, tables } = options;
  const restored: Record<string, number> = {};
  const errors: string[] = [];

  try {
    const tablesToRestore = tables || Object.keys(backupData.tables);

    for (const tableName of tablesToRestore) {
      if (!backupData.tables[tableName]) {
        continue;
      }

      try {
        // Optionnel: vider la table existante
        if (clearExisting) {
          const { error: deleteError } = await supabase
            .from(tableName as any)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Condition qui supprime tout

          if (deleteError) {
            console.warn(`Impossible de vider la table ${tableName}:`, deleteError);
          }
        }

        // Restaurer les données
        const { data, error } = await supabase
          .from(tableName as any)
          .insert(backupData.tables[tableName]);

        if (error) {
          errors.push(`Erreur lors de la restauration de ${tableName}: ${error.message}`);
          continue;
        }

        restored[tableName] = backupData.tables[tableName].length;
      } catch (tableError) {
        errors.push(`Erreur lors de la restauration de ${tableName}: ${tableError}`);
      }
    }

    return {
      success: errors.length === 0,
      restored,
      errors
    };
  } catch (error) {
    return {
      success: false,
      restored,
      errors: [`Erreur générale de restauration: ${error}`]
    };
  }
};

export const validateBackup = (backupData: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!backupData || typeof backupData !== 'object') {
    errors.push('Données de sauvegarde invalides');
    return { valid: false, errors };
  }

  if (!backupData.timestamp || !backupData.version || !backupData.tables) {
    errors.push('Structure de sauvegarde incomplète');
  }

  if (!backupData.metadata || typeof backupData.metadata !== 'object') {
    errors.push('Métadonnées de sauvegarde manquantes');
  }

  // Vérifier que les tables contiennent des arrays
  if (backupData.tables) {
    Object.entries(backupData.tables).forEach(([tableName, data]) => {
      if (!Array.isArray(data)) {
        errors.push(`Table ${tableName}: les données doivent être un tableau`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const scheduleAutomaticBackup = (intervalHours: number = 24): void => {
  const backupInterval = intervalHours * 60 * 60 * 1000; // Convertir en millisecondes

  const performBackup = async () => {
    try {
      const backup = await createBackup();
      
      // Stocker en localStorage avec rotation (garder les 5 dernières)
      const backups = JSON.parse(localStorage.getItem('e2d_auto_backups') || '[]');
      backups.push({
        ...backup,
        auto: true
      });
      
      // Garder seulement les 5 dernières sauvegardes automatiques
      if (backups.length > 5) {
        backups.splice(0, backups.length - 5);
      }
      
      localStorage.setItem('e2d_auto_backups', JSON.stringify(backups));
      
      console.log('Sauvegarde automatique créée:', backup.timestamp);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde automatique:', error);
    }
  };

  // Première sauvegarde immédiate
  performBackup();

  // Programmer les sauvegardes suivantes
  setInterval(performBackup, backupInterval);

  console.log(`Sauvegarde automatique programmée toutes les ${intervalHours} heures`);
};

export const getStoredBackups = (): BackupData[] => {
  try {
    return JSON.parse(localStorage.getItem('e2d_auto_backups') || '[]');
  } catch {
    return [];
  }
};

export const deleteStoredBackup = (timestamp: string): void => {
  try {
    const backups = getStoredBackups();
    const filteredBackups = backups.filter(b => b.timestamp !== timestamp);
    localStorage.setItem('e2d_auto_backups', JSON.stringify(filteredBackups));
  } catch (error) {
    console.error('Erreur lors de la suppression de la sauvegarde:', error);
  }
};

// Utilitaire pour formater la taille en octets
const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};