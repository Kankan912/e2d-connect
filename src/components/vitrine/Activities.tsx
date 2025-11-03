import { useState, useEffect } from "react";
import { Heart, Users, Trophy, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  title: string;
  content: string;
  icon_name?: string;
  image_url?: string;
  order_index: number;
}

const iconMap: Record<string, any> = {
  heart: Heart,
  users: Users,
  trophy: Trophy,
  sparkles: Sparkles,
};

const Activities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("cms_sections")
        .select("*")
        .eq("page_key", "activities")
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="activities" className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-muted rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="activities" className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Nos <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Activités</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez les différentes activités et services que nous proposons à nos membres
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {activities.map((activity) => {
            const Icon = activity.icon_name ? iconMap[activity.icon_name.toLowerCase()] : Sparkles;
            
            if (activity.image_url) {
              return (
                <div
                  key={activity.id}
                  className="group relative overflow-hidden rounded-2xl shadow-xl cursor-pointer h-80"
                >
                  {/* Image Background */}
                  <img
                    src={activity.image_url}
                    alt={activity.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    {Icon && (
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <h3 className="text-2xl font-bold mb-2">{activity.title}</h3>
                    <p className="text-sm text-white/90 line-clamp-2">{activity.content}</p>
                  </div>
                </div>
              );
            }

            return (
              <Card
                key={activity.id}
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-border"
              >
                <CardHeader>
                  {Icon && (
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <CardTitle className="text-2xl">{activity.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {activity.content}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Activities;
