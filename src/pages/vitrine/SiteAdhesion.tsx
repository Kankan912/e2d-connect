import { useState } from "react";
import { PublicLayout } from "@/components/vitrine/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

export default function SiteAdhesion() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    type_adhesion: "e2d",
    motivation: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("demandes_adhesion")
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Demande envoyée !",
        description: "Nous examinerons votre demande et vous contacterons bientôt.",
      });

      setFormData({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        type_adhesion: "e2d",
        motivation: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'envoi de la demande.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <PublicLayout
      title="Devenir Membre - Association E2D Connect"
      description="Rejoignez l'Association E2D Connect et participez à nos activités solidaires"
    >
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Devenir Membre
            </h1>
            <p className="text-xl text-muted-foreground">
              Rejoignez notre communauté et participez à nos activités
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-6 w-6" />
                Formulaire d'Adhésion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                      placeholder="Votre nom"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input
                      id="prenom"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      required
                      placeholder="Votre prénom"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone *</Label>
                    <Input
                      id="telephone"
                      name="telephone"
                      type="tel"
                      value={formData.telephone}
                      onChange={handleChange}
                      required
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Type d'adhésion *</Label>
                  <RadioGroup
                    value={formData.type_adhesion}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, type_adhesion: value }))
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="e2d" id="e2d" />
                      <Label htmlFor="e2d" className="font-normal cursor-pointer">
                        E2D Connect (Tontine, Épargne, Prêts)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="phoenix" id="phoenix" />
                      <Label htmlFor="phoenix" className="font-normal cursor-pointer">
                        Phoenix Football Club
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="les_deux" id="les_deux" />
                      <Label htmlFor="les_deux" className="font-normal cursor-pointer">
                        Les Deux (E2D + Phoenix)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivation">
                    Motivation (Pourquoi souhaitez-vous nous rejoindre ?)
                  </Label>
                  <Textarea
                    id="motivation"
                    name="motivation"
                    value={formData.motivation}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Parlez-nous de vos motivations..."
                  />
                </div>

                <Button type="submit" disabled={loading} size="lg" className="w-full">
                  {loading ? (
                    "Envoi en cours..."
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Envoyer ma Demande
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
