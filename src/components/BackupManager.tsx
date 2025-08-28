import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  Archive, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FileUpload from '@/components/ui/file-upload';
import {
  createBackup,
  downloadBackup,
  restoreFromBackup,
  validateBackup,
  getStoredBackups,
  deleteStoredBackup,
  scheduleAutomaticBackup,
  BackupData
} from '@/lib/backup';

export default function BackupManager() {
  const [loading, setLoading] = useState(false);
  const [restoreFiles, setRestoreFiles] = useState<File[]>([]);
  const [storedBackups, setStoredBackups] = useState<BackupData[]>(getStoredBackups());
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(
    localStorage.getItem('e2d_auto_backup_enabled') === 'true'
  );
  const { toast } = useToast();

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const backup = await createBackup();
      downloadBackup(backup);
      
      toast({
        title: "Sauvegarde créée",
        description: `${backup.metadata.totalRecords} enregistrements sauvegardés (${backup.metadata.backupSize})`
      });
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de créer la sauvegarde",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (restoreFiles.length === 0) return;

    setLoading(true);
    try {
      const file = restoreFiles[0];
      const text = await file.text();
      const backupData = JSON.parse(text);

      const validation = validateBackup(backupData);
      if (!validation.valid) {
        toast({
          title: "Fichier de sauvegarde invalide",
          description: validation.errors.join(', '),
          variant: "destructive"
        });
        return;
      }

      const result = await restoreFromBackup(backupData, { clearExisting: false });
      
      if (result.success) {
        const restoredCount = Object.values(result.restored).reduce((sum, count) => sum + count, 0);
        toast({
          title: "Restauration réussie",
          description: `${restoredCount} enregistrements restaurés`
        });
        setRestoreFiles([]);
      } else {
        toast({
          title: "Restauration partielle",
          description: `Erreurs: ${result.errors.join(', ')}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de restauration",
        description: "Impossible de restaurer la sauvegarde",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoBackup = () => {
    const newStatus = !autoBackupEnabled;
    setAutoBackupEnabled(newStatus);
    localStorage.setItem('e2d_auto_backup_enabled', newStatus.toString());

    if (newStatus) {
      scheduleAutomaticBackup(24); // Toutes les 24 heures
      toast({
        title: "Sauvegarde automatique activée",
        description: "Une sauvegarde sera créée automatiquement toutes les 24 heures"
      });
    } else {
      toast({
        title: "Sauvegarde automatique désactivée",
        description: "Les sauvegardes automatiques ont été arrêtées"
      });
    }
  };

  const handleDeleteBackup = (timestamp: string) => {
    deleteStoredBackup(timestamp);
    setStoredBackups(getStoredBackups());
    toast({
      title: "Sauvegarde supprimée",
      description: "La sauvegarde a été supprimée du stockage local"
    });
  };

  const refreshStoredBackups = () => {
    setStoredBackups(getStoredBackups());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Gestionnaire de Sauvegardes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Actions principales */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCreateBackup} disabled={loading}>
              <Download className="w-4 h-4 mr-2" />
              {loading ? "Création..." : "Créer une sauvegarde"}
            </Button>
            
            <Button 
              variant="outline"
              onClick={toggleAutoBackup}
            >
              <Clock className="w-4 h-4 mr-2" />
              Sauvegarde auto: {autoBackupEnabled ? "ON" : "OFF"}
            </Button>

            <Button 
              variant="outline" 
              onClick={refreshStoredBackups}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>

          {/* Information sur la sauvegarde automatique */}
          {autoBackupEnabled && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                La sauvegarde automatique est activée. Une sauvegarde complète sera créée 
                automatiquement toutes les 24 heures et stockée localement.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Restauration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restaurer une sauvegarde
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-warning/20 bg-warning/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Attention:</strong> La restauration peut écraser des données existantes. 
              Assurez-vous d'avoir une sauvegarde récente avant de procéder.
            </AlertDescription>
          </Alert>

          <FileUpload
            onFilesSelected={setRestoreFiles}
            onFileRemove={(index) => {
              const newFiles = [...restoreFiles];
              newFiles.splice(index, 1);
              setRestoreFiles(newFiles);
            }}
            selectedFiles={restoreFiles}
            maxFiles={1}
            accept={{
              'application/json': ['.json']
            }}
            disabled={loading}
          />

          {restoreFiles.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={handleRestoreBackup} disabled={loading}>
                {loading ? "Restauration..." : "Restaurer la sauvegarde"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setRestoreFiles([])}
                disabled={loading}
              >
                Annuler
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sauvegardes stockées localement */}
      {storedBackups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Sauvegardes automatiques ({storedBackups.length}/5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {storedBackups
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((backup, index) => (
                  <div 
                    key={backup.timestamp}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        <p className="font-medium">
                          {new Date(backup.timestamp).toLocaleString('fr-FR')}
                        </p>
                        <p className="text-muted-foreground">
                          {backup.metadata.totalRecords} enregistrements • {backup.metadata.backupSize}
                        </p>
                      </div>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0 ? "Plus récente" : "Automatique"}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadBackup(backup)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Télécharger
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteBackup(backup.timestamp)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}