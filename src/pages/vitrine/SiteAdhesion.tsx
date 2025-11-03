import { useState } from "react";
import { PublicLayout } from "@/components/vitrine/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Check, Star } from "lucide-react";
import { ADHESION_TARIFS, ADHESION_LABELS, type AdhesionType } from "@/lib/payment-utils";
import { cn } from "@/lib/utils";

export default function SiteAdhesion() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<AdhesionType>("e2d");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast({
        title: "Conditions requises",
        description: "Veuillez accepter les conditions pour continuer.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("adhesions")
        .insert([{
          ...formData,
          type_adhesion: selectedType,
          montant_paye: ADHESION_TARIFS[selectedType],
          payment_status: "pending",
          payment_method: "pending",
        }]);

      if (error) throw error;

      toast({
        title: "Demande envoyée !",
        description: "Nous examinerons votre demande et vous contacterons bientôt.",
      });

      // Reset form
      setFormData({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        message: "",
      });
      setAcceptedTerms(false);
    } catch (error) {
      console.error("Error submitting adhesion:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'envoi de la demande.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const adhesionTypes = [
    {
      type: "e2d" as AdhesionType,
      title: "E2D Connect",
      description: "Accès à la tontine, épargne et prêts solidaires",
      price: ADHESION_TARIFS.e2d,
      popular: false,
      features: ["Participation aux réunions", "Épargne collective", "Prêts solidaires", "Aide financière"],
    },
    {
      type: "phoenix" as AdhesionType,
      title: "Phoenix Football Club",
      description: "Adhésion au club de football Phoenix",
      price: ADHESION_TARIFS.phoenix,
      popular: false,
      features: ["Entraînements réguliers", "Compétitions", "Équipement fourni", "Coaching professionnel"],
    },
    {
      type: "both" as AdhesionType,
      title: "E2D + Phoenix",
      description: "Formule complète avec tous les avantages",
      price: ADHESION_TARIFS.both,
      popular: true,
      features: ["Tous les avantages E2D", "Tous les avantages Phoenix", "Tarif préférentiel", "Accès prioritaire"],
    },
  ];

  return (
    <PublicLayout
      title="Devenir Membre - Association E2D Connect"
      description="Rejoignez l'Association E2D Connect et participez à nos activités solidaires"
    >
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <img
                src="/lovable-uploads/c1efd290-dcb8-44ad-bd52-81f65f2cb640.png"
                alt="E2D Connect"
                className="h-24"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Devenir Membre
            </h1>
            <p className="text-xl text-muted-foreground">
              Rejoignez notre communauté et participez à nos activités
            </p>
          </div>

          {/* Cards de sélection */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {adhesionTypes.map((adhesion) => (
              <Card
                key={adhesion.type}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg relative",
                  selectedType === adhesion.type && "ring-2 ring-primary shadow-lg"
                )}
                onClick={() => setSelectedType(adhesion.type)}
              >
                {adhesion.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Populaire
                    </div>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-2xl">{adhesion.title}</CardTitle>
                    <RadioGroupItem
                      value={adhesion.type}
                      checked={selectedType === adhesion.type}
                      className="h-6 w-6"
                    />
                  </div>
                  <CardDescription>{adhesion.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{adhesion.price}€</span>
                    <span className="text-muted-foreground"> / an</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {adhesion.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Formulaire */}
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

                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message (Pourquoi souhaitez-vous nous rejoindre ?)
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Parlez-nous de vos motivations..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    J'accepte les conditions générales et le règlement intérieur de l'association
                  </label>
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
