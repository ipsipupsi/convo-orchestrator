import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, History, User } from 'lucide-react';
import { ChatPanel, Message } from '@/components/ChatPanel';
import { OverseerPanel } from '@/components/OverseerPanel';
import { SettingsModal, AIConfig } from '@/components/SettingsModal';
import { AIService, ChatSession } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

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
  const [currentMessages, setCurrentMessages] = useState<{
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
  const { toast } = useToast();
  const navigate = useNavigate();

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
      setCurrentMessages({ A: '', B: '' });
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

  const handleInjectNote = useCallback(async (note: string) => {
    if (!currentSession) return;
    
    try {
      // For now, just add to state - in a real implementation, 
      // you'd send this to the AI models as context
      setSessionState(prev => prev ? {
        ...prev,
        pendingNotes: [...prev.pendingNotes, note]
      } : null);
      
      toast({
        title: 'Note Injected',
        description: 'Note has been added to the conversation context.',
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