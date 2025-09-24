// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuthed = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const supabaseAdmin = createClient(url, service);

    const { data: userRes, error: userErr } = await supabaseAuthed.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const user = userRes.user;

    // 1) Ensure role 'administrateur' exists
    const { data: roleData, error: roleSelectErr } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', 'administrateur')
      .maybeSingle();

    let roleId = roleData?.id as string | undefined;
    if (!roleId) {
      const { data: newRole, error: roleInsertErr } = await supabaseAdmin
        .from('roles')
        .insert({ name: 'administrateur', description: 'Accès complet' })
        .select('id')
        .single();
      if (roleInsertErr) throw roleInsertErr;
      roleId = newRole.id as string;
    }

    // 2) Find or create membre for this user
    const { data: membre, error: membreErr } = await supabaseAdmin
      .from('membres')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    let membreId = membre?.id as string | undefined;
    if (!membreId) {
      const { data: newMembre, error: insertMembreErr } = await supabaseAdmin
        .from('membres')
        .insert({
          user_id: user.id,
          nom: (user.user_metadata as any)?.nom ?? '',
          prenom: (user.user_metadata as any)?.prenom ?? '',
          email: user.email,
          telephone: (user.user_metadata as any)?.telephone ?? '',
          statut: 'actif',
          est_membre_e2d: true,
        })
        .select('id')
        .single();
      if (insertMembreErr) throw insertMembreErr;
      membreId = newMembre.id as string;
    }

    // 3) Upsert mapping membres_roles
    const { error: mapErr } = await supabaseAdmin
      .from('membres_roles')
      .upsert({ membre_id: membreId, role_id: roleId }, { onConflict: 'membre_id,role_id' });
    if (mapErr) throw mapErr;

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as any)?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});