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

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    let {
      serveur_smtp,
      port_smtp,
      utilisateur_smtp,
      mot_de_passe_smtp,
      encryption_type,
      email_test,
    }: TestSMTPRequest = await req.json();

    // Nettoyer les espaces pour éviter les erreurs DNS
    serveur_smtp = serveur_smtp.trim();
    utilisateur_smtp = utilisateur_smtp.trim();
    if (email_test) email_test = email_test.trim();

    console.log(`Test SMTP: ${serveur_smtp}:${port_smtp}`);

    // Validation des paramètres
    if (!serveur_smtp || !port_smtp || !utilisateur_smtp || !mot_de_passe_smtp) {
      throw new Error("Paramètres SMTP incomplets");
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const destinataireEmail = email_test || utilisateur_smtp;
    if (!emailRegex.test(destinataireEmail)) {
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

    // Configuration nodemailer
    const transportConfig: any = {
      host: serveur_smtp,
      port: port_smtp,
      secure: encryption_type === 'SSL',
      auth: {
        user: utilisateur_smtp,
        pass: mot_de_passe_smtp,
      },
    };

    // Configuration TLS si nécessaire
    if (encryption_type === 'TLS' || encryption_type === 'NONE') {
      transportConfig.tls = {
        rejectUnauthorized: false
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    // Envoi de l'email de test
    const mailOptions = {
      from: utilisateur_smtp,
      to: destinataireEmail,
      subject: "🔔 Test de Configuration SMTP - E2D",
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
              .success-box {
                background: #d4edda;
                color: #155724;
                padding: 15px;
                border-left: 4px solid #28a745;
                margin: 20px 0;
                border-radius: 4px;
              }
              .info-list {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 4px;
                margin: 15px 0;
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
              <h1>✅ Test de Configuration SMTP</h1>
              <p>E2D Association</p>
            </div>
            
            <div class="content">
              <div class="success-box">
                <strong>✓ Succès!</strong> Votre configuration SMTP fonctionne correctement.
              </div>

              <p>Cet email confirme que votre serveur SMTP est correctement configuré et peut envoyer des emails.</p>

              <div class="info-list">
                <p><strong>Informations de test:</strong></p>
                <ul>
                  <li><strong>Serveur:</strong> ${serveur_smtp}:${port_smtp}</li>
                  <li><strong>Chiffrement:</strong> ${encryption_type}</li>
                  <li><strong>Email expéditeur:</strong> ${utilisateur_smtp}</li>
                  <li><strong>Date du test:</strong> ${new Date().toLocaleString('fr-FR')}</li>
                </ul>
              </div>

              <p>Vous pouvez maintenant utiliser cette configuration pour envoyer des notifications automatiques à vos membres.</p>
            </div>

            <div class="footer">
              <p>E2D Association - Système de Notifications</p>
              <p>Cet email a été généré automatiquement lors d'un test de configuration.</p>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email de test envoyé:", info.messageId);

    // Logger dans l'historique des notifications
    const { error: logError } = await supabase
      .from('notifications_historique')
      .insert([{
        type_notification: 'test_smtp',
        destinataire_email: destinataireEmail,
        sujet: "🔔 Test de Configuration SMTP - E2D",
        contenu: "Email de test de configuration SMTP",
        statut: 'envoye',
        variables_utilisees: {
          serveur: serveur_smtp,
          port: port_smtp,
          encryption: encryption_type,
        },
      }]);

    if (logError) {
      console.error("Erreur lors du logging:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email de test envoyé avec succès",
        details: {
          serveur: serveur_smtp,
          port: port_smtp,
          utilisateur: utilisateur_smtp,
          encryption: encryption_type,
          email_test: destinataireEmail,
          messageId: info.messageId,
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
    
    // Logger l'erreur dans l'historique
    try {
      const { serveur_smtp, email_test, utilisateur_smtp } = await req.json();
      await supabase
        .from('notifications_historique')
        .insert([{
          type_notification: 'test_smtp',
          destinataire_email: email_test || utilisateur_smtp,
          sujet: "🔔 Test de Configuration SMTP - E2D",
          contenu: "Tentative de test SMTP",
          statut: 'erreur',
          erreur_message: error.message,
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
