// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { statut = 'reussi', user_id } = await req.json().catch(() => ({ statut: 'reussi' }));
    
    // Extract first IP from x-forwarded-for (can contain multiple IPs separated by commas)
    let ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;
    if (ip && ip.includes(',')) {
      ip = ip.split(',')[0].trim(); // Take only first IP
    }
    
    const userAgent = req.headers.get('user-agent') || null;

    // If no user_id provided, try to get from auth header
    let uid = user_id as string | null;
    if (!uid) {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        // We cannot verify JWT here without a library; keep uid null
        // Client should send user_id when possible
      }
    }

    const { error } = await supabase.from('historique_connexion').insert({
      user_id: uid,
      statut,
      ip_address: ip,
      user_agent: userAgent,
      date_connexion: new Date().toISOString(),
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    });
  }
});
