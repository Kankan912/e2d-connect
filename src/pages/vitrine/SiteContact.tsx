import { useState } from "react";
import { PublicLayout } from "@/components/vitrine/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function SiteContact() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    objet: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("messages_contact")
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });

      setFormData({
        nom: "",
        email: "",
        telephone: "",
        objet: "",
        message: "",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'envoi du message.",
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
      title="Contact - Association E2D Connect"
      description="Contactez l'Association E2D Connect pour toute question ou demande d'information"
    >
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Contactez-Nous
            </h1>
            <p className="text-xl text-muted-foreground">
              Une question ? N'hésitez pas à nous contacter
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Mail className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Email</h3>
                <a
                  href="mailto:contact@e2d-connect.fr"
                  className="text-muted-foreground hover:text-primary"
                >
                  contact@e2d-connect.fr
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Phone className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Téléphone</h3>
                <a
                  href="tel:+33123456789"
                  className="text-muted-foreground hover:text-primary"
                >
                  +33 1 23 45 67 89
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <MapPin className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Adresse</h3>
                <p className="text-muted-foreground">
                  123 Rue de la République<br />
                  75001 Paris, France
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Envoyez-nous un Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom complet *</Label>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input
                      id="telephone"
                      name="telephone"
                      type="tel"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objet">Objet *</Label>
                    <Input
                      id="objet"
                      name="objet"
                      value={formData.objet}
                      onChange={handleChange}
                      required
                      placeholder="Objet de votre message"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Votre message..."
                  />
                </div>

                <Button type="submit" disabled={loading} size="lg">
                  {loading ? (
                    "Envoi en cours..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer le Message
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
