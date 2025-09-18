import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  Camera, 
  User, 
  Grid3X3, 
  List,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone: string;
  photo_url?: string;
  statut: string;
}

interface PhotoMembre {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  photo_url?: string;
  statut: string;
  photo_info?: {
    size: number;
    lastModified: string;
    type: string;
  };
}

export const GestionPhotos: React.FC = () => {
  const [membres, setMembres] = useState<PhotoMembre[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedMembre, setSelectedMembre] = useState<PhotoMembre | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadMembres = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom, email, telephone, photo_url, statut')
        .eq('statut', 'actif')
        .order('nom');

      if (error) throw error;

      // Enrichir avec les informations des photos si disponibles
      const membresEnriches = await Promise.all(
        (data || []).map(async (membre) => {
          let photoInfo = null;
          
          if (membre.photo_url) {
            try {
              // Extraire le nom du fichier de l'URL
              const fileName = membre.photo_url.split('/').pop();
              if (fileName) {
                const { data: fileData, error: fileError } = await supabase.storage
                  .from('membre-photos')
                  .list(membre.id, {
                    search: fileName
                  });

                if (!fileError && fileData && fileData.length > 0) {
                  photoInfo = {
                    size: fileData[0].metadata?.size || 0,
                    lastModified: fileData[0].updated_at || fileData[0].created_at,
                    type: fileData[0].metadata?.mimetype || 'image/jpeg'
                  };
                }
              }
            } catch (error) {
              console.error('Erreur chargement info photo:', error);
            }
          }

          return {
            ...membre,
            photo_info: photoInfo
          };
        })
      );

      setMembres(membresEnriches);
    } catch (error) {
      console.error('Erreur chargement membres:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des membres",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useRealtimeUpdates({
    table: 'membres',
    onUpdate: loadMembres,
    enabled: true
  });

  useEffect(() => {
    loadMembres();
  }, []);

  const handleFileSelect = (membreId: string) => {
    setUploadingId(membreId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!uploadingId) return;

    try {
      // Validation du fichier
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        throw new Error('Le fichier ne doit pas dépasser 5MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }

      // Générer un nom unique pour le fichier
      const fileExt = file.name.split('.').pop();
      const fileName = `${uploadingId}/avatar_${Date.now()}.${fileExt}`;

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('membre-photos')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('membre-photos')
        .getPublicUrl(fileName);

      // Mettre à jour le profil du membre
      const { error: updateError } = await supabase
        .from('membres')
        .update({ photo_url: publicUrl })
        .eq('id', uploadingId);

      if (updateError) throw updateError;

      toast({
        title: "Succès",
        description: "Photo mise à jour avec succès"
      });

      loadMembres();

    } catch (error: any) {
      console.error('Erreur upload photo:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'uploader la photo",
        variant: "destructive"
      });
    } finally {
      setUploadingId(null);
    }
  };

  const supprimerPhoto = async (membre: PhotoMembre) => {
    try {
      if (membre.photo_url) {
        // Extraire le chemin du fichier depuis l'URL
        const url = new URL(membre.photo_url);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(-2).join('/'); // membre_id/filename

        // Supprimer de Storage
        const { error: deleteError } = await supabase.storage
          .from('membre-photos')
          .remove([filePath]);

        if (deleteError) {
          console.error('Erreur suppression storage:', deleteError);
        }
      }

      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from('membres')
        .update({ photo_url: null })
        .eq('id', membre.id);

      if (updateError) throw updateError;

      toast({
        title: "Succès",
        description: "Photo supprimée avec succès"
      });

      loadMembres();
      setSelectedMembre(null);

    } catch (error: any) {
      console.error('Erreur suppression photo:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la photo",
        variant: "destructive"
      });
    }
  };

  const downloadPhoto = async (membre: PhotoMembre) => {
    if (!membre.photo_url) return;

    try {
      const response = await fetch(membre.photo_url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${membre.nom}_${membre.prenom}_photo.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Succès",
        description: "Photo téléchargée"
      });
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la photo",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredMembres = membres.filter(membre =>
    `${membre.nom} ${membre.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (membre.email && membre.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const membresAvecPhoto = filteredMembres.filter(m => m.photo_url);
  const membresSansPhoto = filteredMembres.filter(m => !m.photo_url);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des photos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Gestion des Photos
          </h1>
          <p className="text-muted-foreground">
            Gérer les photos de profil des membres
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Membres</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredMembres.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avec Photo</CardTitle>
            <Camera className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{membresAvecPhoto.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredMembres.length > 0 ? Math.round((membresAvecPhoto.length / filteredMembres.length) * 100) : 0}% complété
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sans Photo</CardTitle>
            <User className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{membresSansPhoto.length}</div>
            <p className="text-xs text-muted-foreground">
              À compléter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Membres sans photo - Priorité */}
      {membresSansPhoto.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <User className="h-5 w-5" />
              Membres sans Photo ({membresSansPhoto.length})
            </CardTitle>
            <CardDescription>
              Priorité : ajouter les photos manquantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {membresSansPhoto.map((membre) => (
                <div key={membre.id} className={`border rounded-lg p-4 ${viewMode === 'list' ? 'flex items-center justify-between' : ''}`}>
                  <div className={`flex items-center gap-3 ${viewMode === 'grid' ? 'mb-3' : ''}`}>
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {membre.nom.charAt(0)}{membre.prenom.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{membre.nom} {membre.prenom}</p>
                      <p className="text-sm text-muted-foreground">{membre.email || 'Pas d\'email'}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleFileSelect(membre.id)}
                    disabled={uploadingId === membre.id}
                    size="sm"
                  >
                    {uploadingId === membre.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Ajouter Photo
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Membres avec photo */}
      {membresAvecPhoto.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Membres avec Photo ({membresAvecPhoto.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-4'}>
              {membresAvecPhoto.map((membre) => (
                <div key={membre.id} className={`border rounded-lg p-4 ${viewMode === 'list' ? 'flex items-center justify-between' : ''}`}>
                  <div className={`flex items-center gap-3 ${viewMode === 'grid' ? 'mb-3' : 'flex-1'}`}>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={membre.photo_url} alt={`${membre.nom} ${membre.prenom}`} />
                      <AvatarFallback>
                        {membre.nom.charAt(0)}{membre.prenom.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{membre.nom} {membre.prenom}</p>
                      <p className="text-sm text-muted-foreground">{membre.email || 'Pas d\'email'}</p>
                      {membre.photo_info && viewMode === 'list' && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(membre.photo_info.size)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className={`flex gap-2 ${viewMode === 'grid' ? 'justify-center' : ''}`}>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedMembre(membre)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{membre.nom} {membre.prenom}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <Avatar className="h-48 w-48">
                              <AvatarImage src={membre.photo_url} alt={`${membre.nom} ${membre.prenom}`} />
                              <AvatarFallback className="text-4xl">
                                {membre.nom.charAt(0)}{membre.prenom.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          {membre.photo_info && (
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Taille: {formatFileSize(membre.photo_info.size)}</p>
                              <p>Type: {membre.photo_info.type}</p>
                              <p>Modifié: {new Date(membre.photo_info.lastModified).toLocaleDateString()}</p>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => downloadPhoto(membre)}
                              className="flex-1"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger
                            </Button>
                            <Button
                              onClick={() => handleFileSelect(membre.id)}
                              className="flex-1"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Remplacer
                            </Button>
                          </div>
                          
                          <Separator />
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" className="w-full">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer la Photo
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer la photo de {membre.nom} {membre.prenom} ?
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => supprimerPhoto(membre)}
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileSelect(membre.id)}
                      disabled={uploadingId === membre.id}
                    >
                      {uploadingId === membre.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      ) : (
                        <Edit3 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            uploadPhoto(file);
          }
          e.target.value = '';
        }}
      />

      {filteredMembres.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun membre trouvé</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};