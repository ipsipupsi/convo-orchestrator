import { supabase } from '@/integrations/supabase/client';

export interface AIConfig {
  provider: string;
  apiKey: string;
  modelA: string;
  modelB: string;
}

export interface ChatSession {
  id: string;
  title: string;
  turn_count: number;
  is_paused: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  model_type: 'A' | 'B' | 'user' | 'system';
  content: string;
  created_at: string;
}

export class AIService {
  static async startSession(config: AIConfig): Promise<{ session: ChatSession; config: any }> {
    const { data, error } = await supabase.functions.invoke('start-session', {
      body: {
        provider: config.provider,
        apiKey: config.apiKey,
        modelA: config.modelA,
        modelB: config.modelB
      }
    });

    if (error) throw error;
    return data;
  }

  static async sendMessage(
    sessionId: string, 
    messages: any[], 
    modelType: 'A' | 'B'
  ): Promise<{ response: string; model: string }> {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        sessionId,
        messages,
        modelType
      }
    });

    if (error) throw error;
    return data;
  }

  static async getUserSessions(): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as ChatMessage[];
  }

  static async getActiveConfiguration() {
    const { data, error } = await supabase
      .from('ai_configurations')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async pauseSession(sessionId: string) {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ is_paused: true })
      .eq('id', sessionId);

    if (error) throw error;
  }

  static async resumeSession(sessionId: string) {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ is_paused: false })
      .eq('id', sessionId);

    if (error) throw error;
  }

  static async updateSessionTurnCount(sessionId: string, turnCount: number) {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ turn_count: turnCount })
      .eq('id', sessionId);

    if (error) throw error;
  }
}