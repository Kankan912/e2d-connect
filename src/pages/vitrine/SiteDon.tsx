import { useState } from "react";
import { PublicLayout } from "@/components/vitrine/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Users, Trophy, Calendar } from "lucide-react";
import { DonationAmountSelector } from "@/components/donations/DonationAmountSelector";
import { PaymentMethodTabs } from "@/components/donations/PaymentMethodTabs";
import { DonationSuccessModal } from "@/components/donations/DonationSuccessModal";
import type { RecurringFrequency, Currency } from "@/lib/payment-utils";

export default function SiteDon() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [amount, setAmount] = useState(50);
  const [frequency, setFrequency] = useState<RecurringFrequency>("once");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [formData, setFormData] = useState({
    donor_name: "",
    donor_email: "",
    donor_phone: "",
    donor_message: "",
  });

  const handleSubmit = async (paymentMethod: string) => {
    if (!formData.donor_name || !formData.donor_email) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir votre nom et email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("donations")
        .insert([{
          ...formData,
          amount,
          currency,
          payment_method: paymentMethod,
          payment_status: "pending",
          is_recurring: frequency !== "once",
          recurring_frequency: frequency !== "once" ? frequency : null,
        }]);

      if (error) throw error;

      setShowSuccess(true);
      
      // Reset form
      setFormData({
        donor_name: "",
        donor_email: "",
        donor_phone: "",
        donor_message: "",
      });
      setAmount(50);
    } catch (error) {
      console.error("Error submitting donation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'enregistrement du don.",
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

  const stats = [
    { icon: Users, label: "Membres", value: "500+" },
    { icon: Trophy, label: "Projets", value: "50+" },
    { icon: Calendar, label: "Années", value: "10" },
  ];

  return (
    <PublicLayout
      title="Faire un Don - Association E2D Connect"
      description="Soutenez l'Association E2D Connect et contribuez à nos projets solidaires"
    >
      <div className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <Heart className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Faire un Don
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Votre générosité nous permet de continuer à soutenir nos membres
            et développer nos activités sportives et solidaires
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-12">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="text-center">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Formulaire Don */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Votre Don</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Informations personnelles */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Vos informations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="donor_name">Nom complet *</Label>
                      <Input
                        id="donor_name"
                        name="donor_name"
                        value={formData.donor_name}
                        onChange={handleChange}
                        required
                        placeholder="Jean Dupont"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="donor_email">Email *</Label>
                      <Input
                        id="donor_email"
                        name="donor_email"
                        type="email"
                        value={formData.donor_email}
                        onChange={handleChange}
                        required
                        placeholder="jean@exemple.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donor_phone">Téléphone (optionnel)</Label>
                    <Input
                      id="donor_phone"
                      name="donor_phone"
                      type="tel"
                      value={formData.donor_phone}
                      onChange={handleChange}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>

                {/* Sélection montant */}
                <DonationAmountSelector
                  amount={amount}
                  setAmount={setAmount}
                  frequency={frequency}
                  setFrequency={setFrequency}
                  currency={currency}
                  setCurrency={setCurrency}
                />

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="donor_message">Message (optionnel)</Label>
                  <Textarea
                    id="donor_message"
                    name="donor_message"
                    value={formData.donor_message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Laissez-nous un message..."
                  />
                </div>

                {/* Méthodes de paiement */}
                <PaymentMethodTabs onSubmit={handleSubmit} loading={loading} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Transparence */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transparence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Projets sportifs</span>
                      <span className="text-sm font-bold">60%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "60%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Équipements</span>
                      <span className="text-sm font-bold">25%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "25%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Formation</span>
                      <span className="text-sm font-bold">10%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "10%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Administration</span>
                      <span className="text-sm font-bold">5%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "5%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Reçu fiscal</h3>
                <p className="text-sm text-muted-foreground">
                  Vous recevrez automatiquement un reçu fiscal pour votre déclaration d'impôts.
                  66% de votre don est déductible.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DonationSuccessModal
        open={showSuccess}
        onOpenChange={setShowSuccess}
        amount={amount}
        currency={currency}
        paymentMethod="bank_transfer"
      />
    </PublicLayout>
  );
}
