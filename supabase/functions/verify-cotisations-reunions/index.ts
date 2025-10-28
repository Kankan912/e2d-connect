import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  reunionId: string;
  dateReunion: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reunionId, dateReunion }: VerificationRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Vérification cotisations pour réunion ${reunionId}`);

    // Récupérer tous les membres actifs
    const { data: membres, error: membresError } = await supabase
      .from("membres")
      .select("id, nom, prenom, email")
      .eq("statut", "actif");

    if (membresError) throw membresError;

    // Récupérer les types de cotisations actifs
    const { data: typesCotisations, error: typesError } = await supabase
      .from("cotisations_types")
      .select("*");

    if (typesError) throw typesError;

    // Récupérer toutes les cotisations récentes (3 derniers mois)
    const dateLimit = new Date();
    dateLimit.setMonth(dateLimit.getMonth() - 3);

    const { data: cotisations, error: cotisationsError } = await supabase
      .from("cotisations")
      .select("membre_id, montant, date_paiement, statut")
      .gte("date_paiement", dateLimit.toISOString().split("T")[0]);

    if (cotisationsError) throw cotisationsError;

    // Analyser les cotisations par membre
    const membresEnDefaut = [];

    for (const membre of membres || []) {
      const cotisationsMembre = cotisations?.filter(
        (c) => c.membre_id === membre.id && c.statut === "paye"
      );

      const totalCotise = cotisationsMembre?.reduce(
        (sum, c) => sum + parseFloat(c.montant.toString()),
        0
      ) || 0;

      // Calculer le montant attendu (exemple: 3 mois * montant minimum)
      const montantAttendu = 15000; // À ajuster selon vos règles

      if (totalCotise < montantAttendu) {
        membresEnDefaut.push({
          membre_id: membre.id,
          nom: `${membre.prenom} ${membre.nom}`,
          email: membre.email,
          totalCotise,
          montantAttendu,
          manquant: montantAttendu - totalCotise,
        });
      }
    }

    // Si des membres sont en défaut, envoyer une alerte
    if (membresEnDefaut.length > 0) {
      console.log(`⚠️ ${membresEnDefaut.length} membre(s) en défaut de cotisation`);
      
      // Ici vous pourriez envoyer un email au trésorier
      // ou créer une notification dans la base
    }

    return new Response(
      JSON.stringify({
        success: true,
        reunion_id: reunionId,
        date_reunion: dateReunion,
        total_membres: membres?.length || 0,
        membres_en_defaut: membresEnDefaut.length,
        details: membresEnDefaut,
        message:
          membresEnDefaut.length === 0
            ? "Tous les membres sont à jour"
            : `${membresEnDefaut.length} membre(s) en retard de cotisation`,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Erreur vérification cotisations:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
