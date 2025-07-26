import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Zap } from 'lucide-react';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  modelType?: 'A' | 'B';
  isStreaming?: boolean;
}

interface ChatPanelProps {
  title: string;
  modelType: 'A' | 'B';
  messages: Message[];
  isTyping: boolean;
  currentMessage?: string;
  streamingContent?: string;
  modelName?: string;
  isConfigured?: boolean;
}

export const ChatPanel = ({ 
  title, 
  modelType, 
  messages, 
  isTyping, 
  currentMessage, 
  streamingContent,
  modelName,
  isConfigured = false
}: ChatPanelProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentMessage, streamingContent]);

  const chatColorClass = modelType === 'A' ? 'chat-ai-a' : 'chat-ai-b';

  return (
    <Card className="flex flex-col h-full bg-card border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {isConfigured && (
            <Zap className="w-4 h-4 text-success" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {modelName && (
            <span className="text-xs text-muted-foreground">{modelName}</span>
          )}
          <Badge 
            variant="secondary" 
            className={`text-xs ${modelType === 'A' ? 'bg-chat-ai-a/20 text-chat-ai-a' : 'bg-chat-ai-b/20 text-chat-ai-b'}`}
          >
            Model {modelType}
          </Badge>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!isConfigured && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <Bot className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Model Not Configured
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure this model panel to start chatting
              </p>
            </div>
          </div>
        )}
        
        {isConfigured && (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start gap-2 max-w-[80%]">
                  {message.type === 'ai' && (
                    <div className={`flex-shrink-0 p-1.5 rounded-full ${
                      modelType === 'A' ? 'bg-chat-ai-a/20 text-chat-ai-a' : 'bg-chat-ai-b/20 text-chat-ai-b'
                    }`}>
                      <Bot className="w-3 h-3" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg p-3 ${
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
                  {message.type === 'user' && (
                    <div className="flex-shrink-0 p-1.5 rounded-full bg-chat-user/20 text-chat-user">
                      <User className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Streaming content with enhanced animation */}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2 max-w-[80%]">
                  <div className={`flex-shrink-0 p-1.5 rounded-full ${
                    modelType === 'A' ? 'bg-chat-ai-a/20 text-chat-ai-a' : 'bg-chat-ai-b/20 text-chat-ai-b'
                  }`}>
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className={`rounded-lg p-3 bg-${chatColorClass}/10 border border-${chatColorClass}/20 text-foreground`}>
                    <p className="text-sm whitespace-pre-wrap">{streamingContent}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Streaming</span>
                      <div className="flex space-x-1">
                        <div className={`w-1.5 h-1.5 bg-${chatColorClass} rounded-full animate-pulse`}></div>
                        <div className={`w-1.5 h-1.5 bg-${chatColorClass} rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
                        <div className={`w-1.5 h-1.5 bg-${chatColorClass} rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Current message (fallback for non-streaming) */}
            {currentMessage && !streamingContent && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2 max-w-[80%]">
                  <div className={`flex-shrink-0 p-1.5 rounded-full ${
                    modelType === 'A' ? 'bg-chat-ai-a/20 text-chat-ai-a' : 'bg-chat-ai-b/20 text-chat-ai-b'
                  }`}>
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className={`rounded-lg p-3 bg-${chatColorClass}/10 border border-${chatColorClass}/20 text-foreground`}>
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
              </div>
            )}
            
            {/* Enhanced typing indicator */}
            {isTyping && !currentMessage && !streamingContent && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className={`flex-shrink-0 p-1.5 rounded-full ${
                    modelType === 'A' ? 'bg-chat-ai-a/20 text-chat-ai-a' : 'bg-chat-ai-b/20 text-chat-ai-b'
                  }`}>
                    <Bot className="w-3 h-3" />
                  </div>
                  <div className={`rounded-lg p-3 bg-${chatColorClass}/10 border border-${chatColorClass}/20`}>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Model {modelType} is thinking</span>
                      <div className="flex space-x-1">
                        <div className={`w-1.5 h-1.5 bg-${chatColorClass} rounded-full animate-pulse`}></div>
                        <div className={`w-1.5 h-1.5 bg-${chatColorClass} rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
                        <div className={`w-1.5 h-1.5 bg-${chatColorClass} rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </Card>
  );
};