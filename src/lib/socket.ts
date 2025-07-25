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
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    models: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    ],
  },
  {
    value: 'xai',
    label: 'xAI',
    models: [
      { value: 'grok-beta', label: 'Grok Beta' },
    ],
  },
  {
    value: 'google',
    label: 'Google (Gemini)',
    models: [
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    ],
  },
  {
    value: 'deepseek',
    label: 'DeepSeek',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    ],
  },
  {
    value: 'qwen',
    label: 'Qwen',
    models: [
      { value: 'qwen-plus', label: 'Qwen Plus' },
      { value: 'qwen-turbo', label: 'Qwen Turbo' },
    ],
  },
  {
    value: 'openrouter',
    label: 'OpenRouter',
    models: [
      { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { value: 'openai/gpt-4o', label: 'GPT-4o' },
    ],
  },
];