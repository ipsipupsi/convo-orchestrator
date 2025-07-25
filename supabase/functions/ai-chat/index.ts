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

    const { sessionId, messages, modelType } = await req.json()

    // Get active configuration for user
    const { data: config } = await supabaseClient
      .from('ai_configurations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!config) {
      return new Response('No active AI configuration found', { status: 400, headers: corsHeaders })
    }

    const model = modelType === 'A' ? config.model_a : config.model_b
    const response = await callAIProvider(config.provider, config.api_key, model, messages)

    // Store message in database
    await supabaseClient
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        model_type: modelType,
        content: response
      })

    return new Response(
      JSON.stringify({ response, model }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function callAIProvider(provider: string, apiKey: string, model: string, messages: any[]) {
  switch (provider) {
    case 'openai':
      return await callOpenAI(apiKey, model, messages)
    case 'anthropic':
      return await callAnthropic(apiKey, model, messages)
    case 'xai':
      return await callXAI(apiKey, model, messages)
    case 'google':
      return await callGoogle(apiKey, model, messages)
    case 'deepseek':
      return await callDeepSeek(apiKey, model, messages)
    case 'qwen':
      return await callQwen(apiKey, model, messages)
    case 'openrouter':
      return await callOpenRouter(apiKey, model, messages)
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

async function callOpenAI(apiKey: string, model: string, messages: any[]) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1000,
      temperature: 0.7
    })
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`)
  }

  return data.choices[0].message.content
}

async function callAnthropic(apiKey: string, model: string, messages: any[]) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      messages
    })
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${data.error?.message || 'Unknown error'}`)
  }

  return data.content[0].text
}

async function callXAI(apiKey: string, model: string, messages: any[]) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1000,
      temperature: 0.7
    })
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`xAI API error: ${data.error?.message || 'Unknown error'}`)
  }

  return data.choices[0].message.content
}

async function callGoogle(apiKey: string, model: string, messages: any[]) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: messages.map(msg => ({
        parts: [{ text: msg.content }],
        role: msg.role === 'user' ? 'user' : 'model'
      }))
    })
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Google API error: ${data.error?.message || 'Unknown error'}`)
  }

  return data.candidates[0].content.parts[0].text
}

async function callDeepSeek(apiKey: string, model: string, messages: any[]) {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1000,
      temperature: 0.7
    })
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${data.error?.message || 'Unknown error'}`)
  }

  return data.choices[0].message.content
}

async function callQwen(apiKey: string, model: string, messages: any[]) {
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: {
        messages
      },
      parameters: {
        max_tokens: 1000,
        temperature: 0.7
      }
    })
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Qwen API error: ${data.message || 'Unknown error'}`)
  }

  return data.output.choices[0].message.content
}

async function callOpenRouter(apiKey: string, model: string, messages: any[]) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1000,
      temperature: 0.7
    })
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${data.error?.message || 'Unknown error'}`)
  }

  return data.choices[0].message.content
}