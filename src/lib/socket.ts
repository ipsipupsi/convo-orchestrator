import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Event types for type safety
export interface MessageChunk {
  sessionId: string;
  modelType: 'A' | 'B';
  chunk: string;
  isComplete: boolean;
}

export interface SessionState {
  sessionId: string;
  turnCount: number;
  isPaused: boolean;
  pendingNotes: string[];
  isActive: boolean;
}

export interface AIProvider {
  value: string;
  label: string;
  models: { value: string; label: string }[];
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    value: 'openai',
    label: 'OpenAI',
    models: [
      { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1 (Latest)' },
      { value: 'o3-2025-04-16', label: 'o3 (Reasoning)' },
      { value: 'o4-mini-2025-04-16', label: 'o4 Mini (Fast Reasoning)' },
      { value: 'gpt-4.1-mini-2025-04-14', label: 'GPT-4.1 Mini' },
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    models: [
      { value: 'claude-opus-4-20250514', label: 'Claude Opus 4 (Latest)' },
      { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Fast)' },
      { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet' },
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    ],
  },
  {
    value: 'xai',
    label: 'xAI',
    models: [
      { value: 'grok-beta', label: 'Grok Beta' },
      { value: 'grok-2', label: 'Grok 2' },
    ],
  },
  {
    value: 'google',
    label: 'Google (Gemini)',
    models: [
      { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental)' },
      { value: 'gemini-1.5-pro-002', label: 'Gemini 1.5 Pro (Latest)' },
      { value: 'gemini-1.5-flash-002', label: 'Gemini 1.5 Flash (Latest)' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
  },
  {
    value: 'deepseek',
    label: 'DeepSeek',
    models: [
      { value: 'deepseek-r1', label: 'DeepSeek R1 (Reasoning)' },
      { value: 'deepseek-v3', label: 'DeepSeek V3' },
      { value: 'deepseek-chat', label: 'DeepSeek Chat' },
      { value: 'deepseek-coder', label: 'DeepSeek Coder' },
    ],
  },
  {
    value: 'qwen',
    label: 'Qwen',
    models: [
      { value: 'qwen3-coder-32b', label: 'Qwen 3 Coder 32B' },
      { value: 'qwen2.5-coder-32b', label: 'Qwen 2.5 Coder 32B' },
      { value: 'qwen-plus', label: 'Qwen Plus' },
      { value: 'qwen-turbo', label: 'Qwen Turbo' },
      { value: 'qwen-max', label: 'Qwen Max' },
    ],
  },
  {
    value: 'openrouter',
    label: 'OpenRouter',
    models: [
      // Latest models
      { value: 'qwen/qwen-3-coder-32b-instruct:free', label: 'Qwen 3 Coder 32B (FREE)' },
      { value: 'moonshot/kimi-k2-large', label: 'Kimi K2 Large (FREE)' },
      { value: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 (FREE)' },
      { value: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (FREE)' },
      { value: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (FREE)' },
      { value: 'qwen/qwen-2.5-coder-32b-instruct:free', label: 'Qwen 2.5 Coder 32B (FREE)' },
      { value: 'huggingfaceh4/zephyr-7b-beta:free', label: 'Zephyr 7B Beta (FREE)' },
      // Premium models
      { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { value: 'openai/gpt-4o', label: 'GPT-4o' },
      { value: 'openai/o1-preview', label: 'OpenAI o1 Preview' },
      { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5' },
      { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B' },
    ],
  },
];