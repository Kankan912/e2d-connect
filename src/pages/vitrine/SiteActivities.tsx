import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/vitrine/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Coins, HandHelping, Trophy } from "lucide-react";

interface Section {
  id: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  image_url: string | null;
  order_index: number;
}

const iconMap: Record<number, React.ReactNode> = {
  1: <Wallet className="h-12 w-12 text-primary" />,
  2: <Coins className="h-12 w-12 text-primary" />,
  3: <HandHelping className="h-12 w-12 text-primary" />,
  4: <Trophy className="h-12 w-12 text-primary" />,
};

export default function SiteActivities() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const { data } = await supabase
          .from("cms_sections")
          .select("*")
          .eq("page_key", "activities")
          .eq("is_active", true)
          .order("order_index", { ascending: true });

        if (data) setSections(data);
      } catch (error) {
        console.error("Error fetching sections:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  return (
    <PublicLayout
      title="Nos Activités - Association E2D Connect"
      description="Découvrez les activités proposées par l'Association E2D Connect : tontine, épargne, prêts et football"
    >
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Nos Activités
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            E2D Connect propose diverses activités pour accompagner ses membres dans leurs projets
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-8">
                  <div className="h-32 bg-muted animate-pulse rounded mb-4" />
                  <div className="h-4 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((section) => (
              <Card key={section.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    {iconMap[section.order_index] || (
                      <div className="h-12 w-12 bg-primary/10 rounded-full" />
                    )}
                    <div>
                      <CardTitle className="text-2xl">{section.title}</CardTitle>
                      {section.subtitle && (
                        <p className="text-muted-foreground">{section.subtitle}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {section.image_url && (
                    <img
                      src={section.image_url}
                      alt={section.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <p className="text-muted-foreground">{section.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
