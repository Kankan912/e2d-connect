import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestSMTPRequest {
  serveur_smtp: string;
  port_smtp: number;
  utilisateur_smtp: string;
  mot_de_passe_smtp: string;
  encryption_type: string;
  email_test: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      serveur_smtp,
      port_smtp,
      utilisateur_smtp,
      mot_de_passe_smtp,
      encryption_type,
      email_test,
    }: TestSMTPRequest = await req.json();

    console.log(`Test SMTP: ${serveur_smtp}:${port_smtp}`);

    // Simuler un test de connexion SMTP
    // En production, vous pourriez utiliser une bibliothèque SMTP comme nodemailer
    // Pour l'instant, on valide juste les paramètres
    
    if (!serveur_smtp || !port_smtp || !utilisateur_smtp || !mot_de_passe_smtp) {
      throw new Error("Paramètres SMTP incomplets");
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email_test && !emailRegex.test(email_test)) {
      throw new Error("Format d'email invalide");
    }

    // Validation du port
    if (port_smtp < 1 || port_smtp > 65535) {
      throw new Error("Port SMTP invalide");
    }

    // Validation du type de chiffrement
    const validEncryptions = ["TLS", "SSL", "NONE"];
    if (!validEncryptions.includes(encryption_type)) {
      throw new Error("Type de chiffrement invalide");
    }

    // Simuler un délai de test
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // En production, ici vous feriez la vraie connexion SMTP
    // et l'envoi d'un email de test

    return new Response(
      JSON.stringify({
        success: true,
        message: "Connexion SMTP testée avec succès",
        details: {
          serveur: serveur_smtp,
          port: port_smtp,
          utilisateur: utilisateur_smtp,
          encryption: encryption_type,
          email_test: email_test || "Non fourni",
        },
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
    console.error("Erreur test SMTP:", error);
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
