import { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LogoUploadProps {
  onLogoUploaded: (url: string) => void;
  currentLogoUrl?: string;
}

export default function LogoUpload({ onLogoUploaded, currentLogoUrl }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

    if (file.size > maxSize) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 2MB",
        variant: "destructive",
      });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Format non supporté",
        description: "Formats acceptés: PNG, JPG, JPEG, SVG",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Créer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('sport-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('sport-logos')
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onLogoUploaded(publicUrl);

      toast({
        title: "Logo uploadé",
        description: "Le logo a été uploadé avec succès",
      });
    } catch (error: any) {
      console.error('Erreur upload:', error);
      toast({
        title: "Erreur d'upload",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onLogoUploaded("");
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">Logo de l'équipe adverse</label>
      
      {previewUrl ? (
        <div className="relative w-32 h-32 border-2 border-border rounded-lg overflow-hidden">
          <img 
            src={previewUrl} 
            alt="Logo équipe adverse" 
            className="w-full h-full object-contain p-2"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-1 right-1 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
            id="logo-upload"
            disabled={uploading}
          />
          <label
            htmlFor="logo-upload"
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? (
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-muted-foreground">Upload en cours...</p>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Cliquez pour sélectionner un logo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, SVG (max 2MB)
                </p>
              </div>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
