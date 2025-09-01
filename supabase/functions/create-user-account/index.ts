import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  password: string;
  roles?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    
    // Create admin Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const resend = new Resend(resendApiKey);

    const { email, nom, prenom, telephone, password, roles = [] }: CreateUserRequest = await req.json();

    console.log('Creating user account for:', email);

    // Create the user account
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        nom,
        prenom,
        telephone
      }
    });

    if (userError) {
      console.error('Error creating user:', userError);
      throw userError;
    }

    console.log('User created successfully:', userData.user.id);

    // Create member profile
    const { error: profileError } = await supabaseAdmin
      .from('membres')
      .insert({
        user_id: userData.user.id,
        nom,
        prenom,
        email,
        telephone,
        statut: 'actif',
        est_membre_e2d: true
      });

    if (profileError) {
      console.error('Error creating member profile:', profileError);
      throw profileError;
    }

    console.log('Member profile created successfully');

    // Assign roles if provided
    if (roles.length > 0) {
      // Get member ID
      const { data: memberData, error: memberError } = await supabaseAdmin
        .from('membres')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (memberError) {
        console.error('Error getting member ID:', memberError);
      } else {
        // Get role IDs
        const { data: roleData, error: roleError } = await supabaseAdmin
          .from('roles')
          .select('id, name')
          .in('name', roles);

        if (roleError) {
          console.error('Error getting roles:', roleError);
        } else if (roleData) {
          // Insert member roles
          const memberRoles = roleData.map(role => ({
            membre_id: memberData.id,
            role_id: role.id
          }));

          const { error: roleAssignError } = await supabaseAdmin
            .from('membres_roles')
            .insert(memberRoles);

          if (roleAssignError) {
            console.error('Error assigning roles:', roleAssignError);
          } else {
            console.log('Roles assigned successfully:', roles);
          }
        }
      }
    }

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: "E2D Connect <onboarding@resend.dev>",
      to: [email],
      subject: "Bienvenue dans E2D Connect - Vos identifiants de connexion",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6, #06b6d4); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">E2D Connect</h1>
            <p style="color: white; margin: 10px 0 0 0;">Plateforme de gestion de l'association</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #1f2937;">Bonjour ${prenom} ${nom},</h2>
            
            <p style="color: #374151; line-height: 1.6;">
              Votre compte E2D Connect a été créé avec succès ! Voici vos identifiants de connexion :
            </p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #374151;"><strong>Email :</strong> ${email}</p>
              <p style="margin: 0 0 10px 0; color: #374151;"><strong>Mot de passe :</strong> ${password}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <em>Nous vous recommandons de changer votre mot de passe lors de votre première connexion.</em>
              </p>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">
              Vous pouvez maintenant vous connecter à la plateforme pour accéder à toutes les fonctionnalités de l'association E2D.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${supabaseUrl.replace('supabase.co', 'lovable.app')}/auth" 
                 style="background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Se connecter maintenant
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Si vous avez des questions, n'hésitez pas à contacter l'administration.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userData.user,
        message: 'Compte créé et email envoyé avec succès'
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
    console.error("Error in create-user-account function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erreur lors de la création du compte'
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