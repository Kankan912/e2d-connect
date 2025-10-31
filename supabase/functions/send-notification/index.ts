import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type_notification: string;
  destinataire_email: string;
  variables: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { type_notification, destinataire_email, variables }: NotificationRequest = await req.json();

    console.log(`Envoi notification ${type_notification} à ${destinataire_email}`);

    // Récupérer la configuration SMTP active
    const { data: smtpConfig, error: smtpError } = await supabase
      .from('smtp_config')
      .select('*')
      .eq('actif', true)
      .single();

    if (smtpError || !smtpConfig) {
      throw new Error("Aucune configuration SMTP active trouvée");
    }

    // Récupérer le template de notification
    const { data: template, error: templateError } = await supabase
      .from('notifications_templates')
      .select('*')
      .eq('code', type_notification)
      .eq('actif', true)
      .single();

    if (templateError || !template) {
      throw new Error(`Template de notification '${type_notification}' non trouvé ou inactif`);
    }

    // Remplacer les variables dans le sujet et le contenu
    let sujet = template.template_sujet || '';
    let contenu = template.template_contenu || '';

    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      sujet = sujet.replace(regex, variables[key]);
      contenu = contenu.replace(regex, variables[key]);
    });

    // Configuration nodemailer
    const transportConfig: any = {
      host: smtpConfig.serveur_smtp.trim(),
      port: smtpConfig.port_smtp,
      secure: smtpConfig.encryption_type === 'SSL',
      auth: {
        user: smtpConfig.utilisateur_smtp.trim(),
        pass: smtpConfig.mot_de_passe_smtp,
      },
    };

    if (smtpConfig.encryption_type === 'TLS' || smtpConfig.encryption_type === 'NONE') {
      transportConfig.tls = {
        rejectUnauthorized: false
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    // Envoi de l'email
    const mailOptions = {
      from: template.email_expediteur 
        ? `${template.email_expediteur.split('@')[0]} <${smtpConfig.utilisateur_smtp}>` 
        : `E2D <${smtpConfig.utilisateur_smtp}>`,
      replyTo: template.email_expediteur || smtpConfig.utilisateur_smtp,
      to: destinataire_email,
      subject: sujet,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
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
              .footer {
                text-align: center;
                padding: 20px;
                color: #666;
                font-size: 12px;
                background: #f9f9f9;
                border-radius: 0 0 10px 10px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📧 ${sujet}</h1>
              <p>E2D Association${template.categorie ? ` - ${template.categorie}` : ''}</p>
            </div>
            
            <div class="content">
              <div style="white-space: pre-wrap; line-height: 1.8;">${contenu}</div>
            </div>

            <div class="footer">
              <p>E2D Association - Système de Notifications</p>
              <p>Cet email a été envoyé automatiquement.</p>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email envoyé:", info.messageId);

    // Logger dans l'historique
    const { error: logError } = await supabase
      .from('notifications_historique')
      .insert([{
        type_notification,
        destinataire_email,
        sujet,
        contenu,
        statut: 'envoye',
        variables_utilisees: variables,
      }]);

    if (logError) {
      console.error("Erreur lors du logging:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification envoyée avec succès",
        messageId: info.messageId,
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
    console.error("Erreur lors de l'envoi de la notification:", error);

    // Logger l'erreur
    try {
      const { type_notification, destinataire_email, variables } = await req.json();
      await supabase
        .from('notifications_historique')
        .insert([{
          type_notification,
          destinataire_email,
          sujet: `Erreur: ${type_notification}`,
          contenu: "Échec d'envoi de notification",
          statut: 'erreur',
          erreur_message: error.message,
          variables_utilisees: variables,
        }]);
    } catch (logError) {
      console.error("Erreur lors du logging de l'erreur:", logError);
    }

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
