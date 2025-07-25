import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { ChatPanel, Message } from '@/components/ChatPanel';
import { OverseerPanel } from '@/components/OverseerPanel';
import { SettingsModal, AIConfig } from '@/components/SettingsModal';
import { initSocket, getSocket, MessageChunk, SessionState } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [messages, setMessages] = useState<{
    A: Message[];
    B: Message[];
  }>({ A: [], B: [] });
  const [currentMessages, setCurrentMessages] = useState<{
    A: string;
    B: string;
  }>({ A: '', B: '' });
  const [typingState, setTypingState] = useState<{
    A: boolean;
    B: boolean;
  }>({ A: false, B: false });
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // Initialize socket connection
  useEffect(() => {
    const socket = initSocket();
    
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to AI Steering Hub backend');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from backend');
    });

    socket.on('messageChunk', (data: MessageChunk) => {
      const { modelType, chunk, isComplete } = data;
      
      if (isComplete) {
        // Move current message to messages array
        setMessages(prev => ({
          ...prev,
          [modelType]: [
            ...prev[modelType],
            {
              id: `ai-${Date.now()}-${modelType}`,
              type: 'ai',
              content: currentMessages[modelType] + chunk,
              timestamp: new Date(),
              modelType,
            },
          ],
        }));
        setCurrentMessages(prev => ({ ...prev, [modelType]: '' }));
        setTypingState(prev => ({ ...prev, [modelType]: false }));
      } else {
        // Append chunk to current message
        setCurrentMessages(prev => ({ 
          ...prev, 
          [modelType]: prev[modelType] + chunk 
        }));
      }
    });

    socket.on('typing', (data: { modelType: 'A' | 'B'; isTyping: boolean }) => {
      setTypingState(prev => ({ ...prev, [data.modelType]: data.isTyping }));
    });

    socket.on('sessionUpdate', (data: SessionState) => {
      setSessionState(data);
    });

    socket.on('error', (error: { message: string }) => {
      toast({
        title: 'Connection Error',
        description: error.message,
        variant: 'destructive',
      });
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('messageChunk');
      socket.off('typing');
      socket.off('sessionUpdate');
      socket.off('error');
    };
  }, [currentMessages, toast]);

  const handleConfigSubmit = useCallback(async (config: AIConfig) => {
    const socket = getSocket();
    if (!socket) return;

    return new Promise<void>((resolve, reject) => {
      socket.emit('initSession', config, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          // Clear previous messages
          setMessages({ A: [], B: [] });
          setCurrentMessages({ A: '', B: '' });
          setTypingState({ A: false, B: false });
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to initialize session'));
        }
      });
    });
  }, []);

  const handlePause = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('pause');
    }
  }, []);

  const handleResume = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('resume');
    }
  }, []);

  const handleInjectNote = useCallback(async (note: string) => {
    const socket = getSocket();
    if (!socket) return;

    return new Promise<void>((resolve, reject) => {
      socket.emit('injectNote', { note }, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to inject note'));
        }
      });
    });
  }, []);

  const handleStartNewSession = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleExportSession = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('exportSession', (data: any) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-steering-session-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Session Exported',
          description: 'Session data has been downloaded as JSON.',
        });
      });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-foreground">AI Steering Hub</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-destructive'}`}></div>
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 h-[calc(100vh-80px)]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Chat Panel A */}
          <div className="lg:col-span-1">
            <ChatPanel
              title="Chat Panel 1"
              modelType="A"
              messages={messages.A}
              isTyping={typingState.A}
              currentMessage={currentMessages.A}
            />
          </div>

          {/* Chat Panel B */}
          <div className="lg:col-span-1">
            <ChatPanel
              title="Chat Panel 2"
              modelType="B"
              messages={messages.B}
              isTyping={typingState.B}
              currentMessage={currentMessages.B}
            />
          </div>

          {/* Overseer Panel */}
          <div className="lg:col-span-1">
            <OverseerPanel
              sessionState={sessionState}
              onPause={handlePause}
              onResume={handleResume}
              onInjectNote={handleInjectNote}
              onStartNewSession={handleStartNewSession}
              onExportSession={handleExportSession}
            />
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSubmit={handleConfigSubmit}
      />
    </div>
  );
};

export default Index;
