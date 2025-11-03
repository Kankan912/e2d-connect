import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/vitrine/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

interface PageContent {
  title: string;
  content: string;
}

export default function SiteAbout() {
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data } = await supabase
          .from("cms_pages")
          .select("title, content")
          .eq("page_key", "about")
          .single();

        if (data) setPageContent(data);
      } catch (error) {
        console.error("Error fetching page content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <PublicLayout
      title="À Propos - Association E2D Connect"
      description="Découvrez l'histoire, la mission et les valeurs de l'Association E2D Connect"
    >
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
            {loading ? "À Propos de Nous" : pageContent?.title || "À Propos de Nous"}
          </h1>

          {loading ? (
            <div className="space-y-4">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
            </div>
          ) : (
            <div className="prose prose-lg max-w-none">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: pageContent?.content || "<p>Contenu en cours de chargement...</p>" 
                }} 
              />
            </div>
          )}

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Notre Mission</h3>
                <p className="text-muted-foreground">
                  Promouvoir l'entraide et le développement communautaire à travers des activités solidaires et sportives.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Nos Valeurs</h3>
                <p className="text-muted-foreground">
                  Solidarité, respect, engagement et transparence sont au cœur de toutes nos actions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Notre Vision</h3>
                <p className="text-muted-foreground">
                  Construire une communauté soudée où chacun peut s'épanouir et contribuer au bien-être collectif.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
