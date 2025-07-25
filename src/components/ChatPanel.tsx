import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  modelType?: 'A' | 'B';
}

interface ChatPanelProps {
  title: string;
  modelType: 'A' | 'B';
  messages: Message[];
  isTyping: boolean;
  currentMessage?: string;
}

export const ChatPanel = ({ title, modelType, messages, isTyping, currentMessage }: ChatPanelProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentMessage]);

  const chatColorClass = modelType === 'A' ? 'chat-ai-a' : 'chat-ai-b';

  return (
    <Card className="flex flex-col h-full bg-card border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <Badge 
          variant="secondary" 
          className={`text-xs ${modelType === 'A' ? 'bg-chat-ai-a/20 text-chat-ai-a' : 'bg-chat-ai-b/20 text-chat-ai-b'}`}
        >
          Model {modelType}
        </Badge>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-chat-user text-primary-foreground'
                  : `bg-${chatColorClass}/10 border border-${chatColorClass}/20 text-foreground`
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        
        {/* Current streaming message */}
        {currentMessage && (
          <div className="flex justify-start">
            <div className={`max-w-[80%] rounded-lg p-3 bg-${chatColorClass}/10 border border-${chatColorClass}/20 text-foreground`}>
              <p className="text-sm whitespace-pre-wrap">{currentMessage}</p>
              {isTyping && (
                <div className="flex items-center space-x-1 mt-2">
                  <div className={`w-2 h-2 bg-${chatColorClass} rounded-full animate-pulse`}></div>
                  <div className={`w-2 h-2 bg-${chatColorClass} rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
                  <div className={`w-2 h-2 bg-${chatColorClass} rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {isTyping && !currentMessage && (
          <div className="flex justify-start">
            <div className={`rounded-lg p-3 bg-${chatColorClass}/10 border border-${chatColorClass}/20`}>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Model {modelType} is typing</span>
                <div className="flex space-x-1">
                  <div className={`w-2 h-2 bg-${chatColorClass} rounded-full animate-pulse`}></div>
                  <div className={`w-2 h-2 bg-${chatColorClass} rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
                  <div className={`w-2 h-2 bg-${chatColorClass} rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </Card>
  );
};