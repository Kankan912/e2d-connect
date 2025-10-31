import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  reunionId: string;
  destinataires: string[];
  sujet: string;
  contenu: string;
  dateReunion: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { reunionId, destinataires, sujet, contenu, dateReunion }: EmailRequest = await req.json();

    console.log(`Envoi CR réunion ${reunionId} à ${destinataires.length} destinataires`);

    console.log(`Préparation envoi à ${destinataires.length} destinataires`);

    // Envoyer l'email à tous les destinataires
    const emailResponse = await resend.emails.send({
      from: "E2D Association <onboarding@resend.dev>",
      to: destinataires,
      subject: `📋 Compte-Rendu: ${sujet}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e0e0e0;
                border-top: none;
              }
              .info-box {
                background: #f5f5f5;
                padding: 15px;
                border-left: 4px solid #667eea;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #666;
                font-size: 12px;
                border-radius: 0 0 10px 10px;
                background: #f9f9f9;
              }
              .section-title {
                color: #667eea;
                border-bottom: 2px solid #667eea;
                padding-bottom: 10px;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📋 Compte-Rendu de Réunion</h1>
              <p>E2D Association</p>
            </div>
            
            <div class="content">
              <div class="info-box">
                <p><strong>📅 Date de la réunion:</strong> ${new Date(dateReunion).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p><strong>📝 Sujet:</strong> ${sujet}</p>
              </div>

              <h2 class="section-title">Points à l'Ordre du Jour</h2>
              <div style="white-space: pre-wrap; line-height: 1.8;">${contenu}</div>

              <div style="margin-top: 40px; padding: 20px; background: #e8f4f8; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px;">
                  <strong>ℹ️ Note:</strong> Ce compte-rendu a été généré automatiquement et envoyé à tous les membres.
                  Pour toute question ou remarque, veuillez contacter le secrétariat.
                </p>
              </div>
            </div>

            <div class="footer">
              <p>E2D Association - Gestion des Réunions</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email envoyé avec succès:", emailResponse);

    // Logger dans l'historique des notifications pour chaque destinataire
    const notificationLogs = destinataires.map(dest => ({
      type_notification: 'reunion_cr',
      destinataire_email: dest,
      sujet: `📋 Compte-Rendu: ${sujet}`,
      contenu: contenu,
      statut: 'envoye',
      variables_utilisees: {
        reunionId,
        dateReunion,
        sujet,
      },
    }));

    const { error: logError } = await supabase
      .from('notifications_historique')
      .insert(notificationLogs);

    if (logError) {
      console.error("Erreur lors du logging des notifications:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.id,
        destinataires: destinataires.length 
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
    console.error("Erreur lors de l'envoi de l'email:", error);
    
    // Logger l'erreur pour chaque destinataire
    try {
      const { reunionId, destinataires, sujet, contenu, dateReunion } = await req.json();
      const errorLogs = destinataires.map((dest: string) => ({
        type_notification: 'reunion_cr',
        destinataire_email: dest,
        sujet: `📋 Compte-Rendu: ${sujet}`,
        contenu: contenu,
        statut: 'erreur',
        erreur_message: error.message,
        variables_utilisees: {
          reunionId,
          dateReunion,
          sujet,
        },
      }));

      await supabase
        .from('notifications_historique')
        .insert(errorLogs);
    } catch (logError) {
      console.error("Erreur lors du logging de l'erreur:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);