import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { provider, apiKey, modelA, modelB } = await req.json()

    // Deactivate existing configurations
    await supabaseClient
      .from('ai_configurations')
      .update({ is_active: false })
      .eq('user_id', user.id)

    // Create new configuration
    const { data: config, error: configError } = await supabaseClient
      .from('ai_configurations')
      .insert({
        user_id: user.id,
        provider,
        api_key: apiKey,
        model_a: modelA,
        model_b: modelB,
        is_active: true
      })
      .select()
      .single()

    if (configError) {
      return new Response(
        JSON.stringify({ error: configError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create new session
    const { data: session, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        configuration_id: config.id,
        title: `Session ${new Date().toLocaleString()}`
      })
      .select()
      .single()

    if (sessionError) {
      return new Response(
        JSON.stringify({ error: sessionError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ session, config }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})