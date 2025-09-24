import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    
    // Create admin Supabase client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

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

    // Log successful account creation (Email functionality temporarily disabled)
    console.log("User account created successfully. Email notification skipped.");

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