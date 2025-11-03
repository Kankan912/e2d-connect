import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/vitrine/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface GalleryImage {
  id: string;
  album_name: string;
  title: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
}

export default function SiteGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [albums, setAlbums] = useState<string[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const { data } = await supabase
          .from("cms_gallery")
          .select("*")
          .eq("is_active", true)
          .order("order_index", { ascending: true });

        if (data) {
          setImages(data);
          const uniqueAlbums = Array.from(
            new Set(data.map((img) => img.album_name))
          );
          setAlbums(uniqueAlbums);
        }
      } catch (error) {
        console.error("Error fetching gallery:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, []);

  const filteredImages = selectedAlbum
    ? images.filter((img) => img.album_name === selectedAlbum)
    : images;

  return (
    <PublicLayout
      title="Galerie Photos - Association E2D Connect"
      description="Découvrez en images la vie de l'Association E2D Connect"
    >
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Galerie Photos
          </h1>
          <p className="text-xl text-muted-foreground">
            Découvrez nos événements et activités en images
          </p>
        </div>

        {/* Albums Filter */}
        {albums.length > 1 && (
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <Badge
              variant={selectedAlbum === null ? "default" : "outline"}
              className="cursor-pointer px-4 py-2"
              onClick={() => setSelectedAlbum(null)}
            >
              Tous ({images.length})
            </Badge>
            {albums.map((album) => {
              const count = images.filter(
                (img) => img.album_name === album
              ).length;
              return (
                <Badge
                  key={album}
                  variant={selectedAlbum === album ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2"
                  onClick={() => setSelectedAlbum(album)}
                >
                  {album} ({count})
                </Badge>
              );
            })}
          </div>
        )}

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="aspect-square bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : filteredImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer bg-muted"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.thumbnail_url || image.image_url}
                  alt={image.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <div className="text-white">
                    <p className="font-semibold">{image.title}</p>
                    <p className="text-sm text-gray-300">{image.album_name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              Aucune photo disponible
              {selectedAlbum && " dans cet album"}
            </p>
          </div>
        )}

        {/* Lightbox */}
        <Dialog
          open={selectedImage !== null}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-5xl">
            {selectedImage && (
              <div className="space-y-4">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.title}
                  className="w-full h-auto rounded-lg"
                />
                <div>
                  <h3 className="text-2xl font-semibold">
                    {selectedImage.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedImage.album_name}
                  </p>
                  {selectedImage.description && (
                    <p className="mt-2">{selectedImage.description}</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PublicLayout>
  );
}
