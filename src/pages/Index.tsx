import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, History, User, Keyboard } from 'lucide-react';
import { ChatPanel, Message } from '@/components/ChatPanel';
import { OverseerPanel } from '@/components/OverseerPanel';
import { SettingsModal, AIConfig } from '@/components/SettingsModal';
import { FirstPromptBanner } from '@/components/FirstPromptBanner';
import { ModelConfigPanel, ModelConfig } from '@/components/ModelConfigPanel';
import { AIService, ChatSession } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { SessionManagement } from '@/components/SessionManagement';
import { CostTracker } from '@/components/CostTracker';
import { KeyboardShortcuts, useKeyboardShortcuts } from '@/components/KeyboardShortcuts';
import { ExportOptions } from '@/components/ExportOptions';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { AI_PROVIDERS } from '@/lib/socket';

interface SessionState {
  sessionId: string;
  turnCount: number;
  isPaused: boolean;
  pendingNotes: string[];
  isActive: boolean;
}

const Index = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<{
    A: Message[];
    B: Message[];
  }>({ A: [], B: [] });
  const [streamingContent, setStreamingContent] = useState<{
    A: string;
    B: string;
  }>({ A: '', B: '' });
  const [typingState, setTypingState] = useState<{
    A: boolean;
    B: boolean;
  }>({ A: false, B: false });
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasFirstMessage, setHasFirstMessage] = useState(false);
  const [isFirstMessageLoading, setIsFirstMessageLoading] = useState(false);
  
  // UI state
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // Model configurations for each panel
  const [modelConfigA, setModelConfigA] = useState<ModelConfig | null>(null);
  const [modelConfigB, setModelConfigB] = useState<ModelConfig | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+n': () => setIsSettingsOpen(true),
    'ctrl+o': () => {}, // Will be handled by SessionManagement component
    'ctrl+e': () => setShowExportOptions(true),
    'ctrl+p': () => sessionState?.isPaused ? handleResume() : handlePause(),
    'ctrl+,': () => setIsSettingsOpen(true),
    'ctrl+/': () => setShowKeyboardShortcuts(true),
    'escape': () => {
      setIsSettingsOpen(false);
      setShowKeyboardShortcuts(false);
      setShowExportOptions(false);
    },
  });

  // Auth state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate('/auth');
        } else {
          setIsConnected(true);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      } else {
        setIsConnected(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load active configuration and session on user login
  useEffect(() => {
    if (user) {
      loadActiveConfiguration();
    }
  }, [user]);

  const loadActiveConfiguration = async () => {
    try {
      const config = await AIService.getActiveConfiguration();
      if (config) {
        const sessions = await AIService.getUserSessions();
        if (sessions.length > 0) {
          const latestSession = sessions[0];
          setCurrentSession(latestSession);
          setSessionState({
            sessionId: latestSession.id,
            turnCount: latestSession.turn_count,
            isPaused: latestSession.is_paused,
            pendingNotes: [],
            isActive: true
          });
          
          // Load messages for the session
          const sessionMessages = await AIService.getSessionMessages(latestSession.id);
          const messagesA: Message[] = [];
          const messagesB: Message[] = [];
          
          sessionMessages.forEach(msg => {
            const message: Message = {
              id: msg.id,
              type: msg.model_type === 'user' ? 'user' : 'ai',
              content: msg.content,
              timestamp: new Date(msg.created_at),
              modelType: msg.model_type as 'A' | 'B'
            };
            
            if (msg.model_type === 'A') {
              messagesA.push(message);
            } else if (msg.model_type === 'B') {
              messagesB.push(message);
            }
          });
          
          setMessages({ A: messagesA, B: messagesB });
        }
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const handleConfigSubmit = useCallback(async (config: AIConfig) => {
    try {
      const result = await AIService.startSession(config);
      setCurrentSession(result.session);
      setSessionState({
        sessionId: result.session.id,
        turnCount: 0,
        isPaused: false,
        pendingNotes: [],
        isActive: true
      });
      
      // Clear previous messages
      setMessages({ A: [], B: [] });
      setStreamingContent({ A: '', B: '' });
      setTypingState({ A: false, B: false });
      
      toast({
        title: 'Session Started',
        description: 'New AI conversation session has been created.',
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to start session');
    }
  }, [toast]);

  const handlePause = useCallback(async () => {
    if (!currentSession) return;
    
    try {
      await AIService.pauseSession(currentSession.id);
      setSessionState(prev => prev ? { ...prev, isPaused: true } : null);
      toast({
        title: 'Session Paused',
        description: 'AI conversation has been paused.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to pause session.',
        variant: 'destructive',
      });
    }
  }, [currentSession, toast]);

  const handleResume = useCallback(async () => {
    if (!currentSession) return;
    
    try {
      await AIService.resumeSession(currentSession.id);
      setSessionState(prev => prev ? { ...prev, isPaused: false } : null);
      toast({
        title: 'Session Resumed',
        description: 'AI conversation has been resumed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resume session.',
        variant: 'destructive',
      });
    }
  }, [currentSession, toast]);

  const handleInjectNote = useCallback(async (note: string, targetModel: 'A' | 'B' | 'All') => {
    if (!currentSession) return;
    
    try {
      // For now, just add to state - in a real implementation, 
      // you'd send this to the AI models as context
      setSessionState(prev => prev ? {
        ...prev,
        pendingNotes: [...prev.pendingNotes, `${targetModel}: ${note}`]
      } : null);
      
      toast({
        title: 'Note Injected',
        description: `Note has been added to ${targetModel === 'All' ? 'both models' : `Model ${targetModel}`}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to inject note.',
        variant: 'destructive',
      });
    }
  }, [currentSession, toast]);

  const handleStartNewSession = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const handleExportSession = useCallback(async () => {
    if (!currentSession) return;
    
    try {
      const sessionMessages = await AIService.getSessionMessages(currentSession.id);
      const exportData = {
        session: currentSession,
        messages: sessionMessages,
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export session.',
        variant: 'destructive',
      });
    }
  }, [currentSession, toast]);

  const handleSessionSelect = useCallback(async (session: ChatSession) => {
    try {
      setCurrentSession(session);
      setSessionState({
        sessionId: session.id,
        turnCount: session.turn_count,
        isPaused: session.is_paused,
        pendingNotes: [],
        isActive: true
      });
      
      // Load messages for the session
      const sessionMessages = await AIService.getSessionMessages(session.id);
      const messagesA: Message[] = [];
      const messagesB: Message[] = [];
      
      sessionMessages.forEach(msg => {
        const message: Message = {
          id: msg.id,
          type: msg.model_type === 'user' ? 'user' : 'ai',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          modelType: msg.model_type as 'A' | 'B'
        };
        
        if (msg.model_type === 'A') {
          messagesA.push(message);
        } else if (msg.model_type === 'B') {
          messagesB.push(message);
        }
      });
      
      setMessages({ A: messagesA, B: messagesB });
      setHasFirstMessage(messagesA.length > 0 || messagesB.length > 0);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load session.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleSessionDelete = useCallback(async (sessionId: string) => {
    // In a real implementation, you'd call an API to delete the session
    // For now, we'll just show a success message
    return Promise.resolve();
  }, []);

  const handleSessionExport = useCallback((session: ChatSession) => {
    setCurrentSession(session);
    setShowExportOptions(true);
  }, []);

  const handleFirstMessage = useCallback(async (message: string, targetModel: 'A' | 'B') => {
    const config = targetModel === 'A' ? modelConfigA : modelConfigB;
    if (!config || !config.provider || !config.apiKey || !config.model) {
      toast({
        title: 'Model Not Configured',
        description: `Please configure Model ${targetModel} before sending messages.`,
        variant: 'destructive',
      });
      return;
    }

    setIsFirstMessageLoading(true);
    setTypingState(prev => ({ ...prev, [targetModel]: true }));

    try {
      // Create a new session if none exists
      if (!currentSession) {
        const sessionData = await AIService.startSession({
          provider: config.provider,
          apiKey: config.apiKey,
          modelA: modelConfigA?.model || config.model,
          modelB: modelConfigB?.model || config.model,
        });
        setCurrentSession(sessionData.session);
        setSessionState({
          sessionId: sessionData.session.id,
          turnCount: 0,
          isPaused: false,
          pendingNotes: [],
          isActive: true
        });
      }

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: message,
        timestamp: new Date(),
        modelType: targetModel
      };

      setMessages(prev => ({
        ...prev,
        [targetModel]: [...prev[targetModel], userMessage]
      }));

      // Simulate streaming response (in real implementation, this would be from the API)
      const response = await AIService.sendMessage(
        currentSession?.id || 'temp',
        [{ role: 'user', content: message }],
        targetModel
      );

      // Simulate streaming
      const aiResponse = response.response;
      let currentContent = '';
      
      for (let i = 0; i < aiResponse.length; i++) {
        currentContent += aiResponse[i];
        setStreamingContent(prev => ({ ...prev, [targetModel]: currentContent }));
        await new Promise(resolve => setTimeout(resolve, 20)); // Simulate typing delay
      }

      // Add final AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date(),
        modelType: targetModel
      };

      setMessages(prev => ({
        ...prev,
        [targetModel]: [...prev[targetModel], aiMessage]
      }));

      setStreamingContent(prev => ({ ...prev, [targetModel]: '' }));
      setHasFirstMessage(true);

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setTypingState(prev => ({ ...prev, [targetModel]: false }));
      setIsFirstMessageLoading(false);
    }
  }, [modelConfigA, modelConfigB, currentSession, toast]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  }, [navigate]);

  if (!user) {
    return null; // Will redirect to auth page
  }

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
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowKeyboardShortcuts(true)}
              className="flex items-center gap-2"
            >
              <Keyboard className="w-4 h-4" />
              Shortcuts
            </Button>
            <SessionManagement
              currentSessionId={currentSession?.id}
              onSessionSelect={handleSessionSelect}
              onSessionDelete={handleSessionDelete}
              onSessionExport={handleSessionExport}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 h-[calc(100vh-80px)]">
        <div className="space-y-4 h-full">
          {/* First Message Banner */}
          {!hasFirstMessage && (
            <FirstPromptBanner
              onSendFirstMessage={handleFirstMessage}
              isLoading={isFirstMessageLoading}
            />
          )}

          {/* Model Configuration Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ModelConfigPanel
              title="Model Configuration A"
              modelType="A"
              config={modelConfigA}
              onConfigChange={setModelConfigA}
            />
            <ModelConfigPanel
              title="Model Configuration B"
              modelType="B"
              config={modelConfigB}
              onConfigChange={setModelConfigB}
            />
          </div>

          {/* Chat and Control Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
            {/* Chat Panel A */}
            <div className="lg:col-span-1">
              <ChatPanel
                title="Chat Panel A"
                modelType="A"
                messages={messages.A}
                isTyping={typingState.A}
                streamingContent={streamingContent.A}
                modelName={modelConfigA ? AI_PROVIDERS.find(p => p.value === modelConfigA.provider)?.models.find(m => m.value === modelConfigA.model)?.label : undefined}
                isConfigured={!!(modelConfigA?.provider && modelConfigA?.apiKey && modelConfigA?.model)}
              />
            </div>

            {/* Chat Panel B */}
            <div className="lg:col-span-1">
              <ChatPanel
                title="Chat Panel B"
                modelType="B"
                messages={messages.B}
                isTyping={typingState.B}
                streamingContent={streamingContent.B}
                modelName={modelConfigB ? AI_PROVIDERS.find(p => p.value === modelConfigB.provider)?.models.find(m => m.value === modelConfigB.model)?.label : undefined}
                isConfigured={!!(modelConfigB?.provider && modelConfigB?.apiKey && modelConfigB?.model)}
              />
            </div>

            {/* Control Panels */}
            <div className="lg:col-span-1 space-y-4">
              <OverseerPanel
                sessionState={sessionState}
                onPause={handlePause}
                onResume={handleResume}
                onInjectNote={handleInjectNote}
                onStartNewSession={handleStartNewSession}
                onExportSession={handleExportSession}
              />
              <CostTracker
                sessionId={currentSession?.id}
                isActive={!!sessionState?.isActive}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSubmit={handleConfigSubmit}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />

      {/* Export Options Modal */}
      <ExportOptions
        isOpen={showExportOptions}
        onClose={() => setShowExportOptions(false)}
        session={currentSession}
        messages={[...messages.A, ...messages.B].map(msg => ({
          id: msg.id,
          session_id: currentSession?.id || '',
          model_type: msg.modelType || (msg.type === 'user' ? 'user' : 'system'),
          content: msg.content,
          created_at: msg.timestamp.toISOString(),
        }))}
      />
    </div>
  );
};

export default Index;