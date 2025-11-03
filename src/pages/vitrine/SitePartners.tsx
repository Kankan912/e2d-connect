import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/vitrine/PublicLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  description: string | null;
  website_url: string | null;
}

export default function SitePartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data } = await supabase
          .from("cms_partners")
          .select("*")
          .eq("is_active", true)
          .order("order_index", { ascending: true });

        if (data) setPartners(data);
      } catch (error) {
        console.error("Error fetching partners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  return (
    <PublicLayout
      title="Nos Partenaires - Association E2D Connect"
      description="Découvrez les partenaires qui soutiennent l'Association E2D Connect"
    >
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Nos Partenaires
          </h1>
          <p className="text-xl text-muted-foreground">
            Ils nous font confiance et nous soutiennent
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i}>
                <CardContent className="p-8">
                  <div className="aspect-square bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : partners.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {partners.map((partner) => (
              <Card
                key={partner.id}
                className="group hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-8">
                  <div className="aspect-square flex items-center justify-center mb-4">
                    <img
                      src={partner.logo_url}
                      alt={partner.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-center mb-2">
                    {partner.name}
                  </h3>
                  {partner.description && (
                    <p className="text-sm text-muted-foreground text-center mb-4 line-clamp-2">
                      {partner.description}
                    </p>
                  )}
                  {partner.website_url && (
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                    >
                      Visiter le site
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              Aucun partenaire pour le moment
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-20 text-center bg-muted/50 rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">
            Devenez Partenaire
          </h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Vous souhaitez soutenir nos actions et devenir partenaire de l'Association E2D Connect ?
          </p>
          <a href="/site/contact">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
              Contactez-nous
            </button>
          </a>
        </div>
      </div>
    </PublicLayout>
  );
}
