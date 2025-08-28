import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  selectedFiles?: File[];
  className?: string;
  disabled?: boolean;
  error?: string;
}

export default function FileUpload({
  onFilesSelected,
  onFileRemove,
  accept = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls']
  },
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  selectedFiles = [],
  className,
  disabled = false,
  error
}: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!disabled) {
      onFilesSelected(acceptedFiles);
    }
  }, [onFilesSelected, disabled]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    disabled
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <img 
        src={URL.createObjectURL(file)} 
        alt={file.name}
        className="w-8 h-8 object-cover rounded"
      />;
    }
    return <File className="w-8 h-8 text-primary" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-destructive"
        )}
      >
        <CardContent className="p-6 text-center">
          <input {...getInputProps()} />
          <Upload className={cn(
            "mx-auto h-12 w-12 mb-4",
            isDragActive ? "text-primary" : "text-muted-foreground"
          )} />
          
          {isDragActive ? (
            <p className="text-primary font-medium">
              Déposez les fichiers ici...
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum {maxFiles} fichier(s) - {formatFileSize(maxSize)} par fichier
              </p>
              <p className="text-xs text-muted-foreground">
                Formats acceptés: images, PDF, Excel
              </p>
            </div>
          )}
          
          {!isDragActive && (
            <Button variant="outline" className="mt-4" disabled={disabled}>
              Sélectionner les fichiers
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Erreurs de validation */}
      {(error || fileRejections.length > 0) && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="space-y-1">
                {error && <p className="text-sm text-destructive">{error}</p>}
                {fileRejections.map(({ file, errors }, index) => (
                  <div key={index} className="text-sm text-destructive">
                    <span className="font-medium">{file.name}:</span>
                    {errors.map((error, i) => (
                      <span key={i} className="ml-1">
                        {error.code === 'file-too-large' && 'Fichier trop volumineux'}
                        {error.code === 'file-invalid-type' && 'Type de fichier non supporté'}
                        {error.code === 'too-many-files' && 'Trop de fichiers sélectionnés'}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Fichiers sélectionnés ({selectedFiles.length})</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {file.type || 'Type inconnu'}
                    </p>
                  </div>
                  {onFileRemove && !disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFileRemove(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}