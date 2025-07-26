import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  History, 
  Search, 
  Calendar, 
  MessageSquare, 
  Clock, 
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { AIService, ChatSession } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface SessionManagementProps {
  currentSessionId?: string;
  onSessionSelect: (session: ChatSession) => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionExport: (session: ChatSession) => void;
}

export const SessionManagement = ({ 
  currentSessionId, 
  onSessionSelect, 
  onSessionDelete,
  onSessionExport 
}: SessionManagementProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = sessions.filter(session =>
      session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSessions(filtered);
  }, [sessions, searchQuery]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const userSessions = await AIService.getUserSessions();
      setSessions(userSessions);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load sessions.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionSelect = (session: ChatSession) => {
    onSessionSelect(session);
    setIsOpen(false);
    toast({
      title: 'Session Loaded',
      description: `Switched to session: ${session.title}`,
    });
  };

  const handleSessionDelete = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await onSessionDelete(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({
        title: 'Session Deleted',
        description: 'Session has been permanently deleted.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete session.',
        variant: 'destructive',
      });
    }
  };

  const handleSessionExport = (session: ChatSession, event: React.MouseEvent) => {
    event.stopPropagation();
    onSessionExport(session);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <History className="w-4 h-4" />
          Sessions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Session Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sessions List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No sessions match your search.' : 'No sessions found.'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSessions.map((session) => (
                  <Card 
                    key={session.id}
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                      currentSessionId === session.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleSessionSelect(session)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium truncate">
                              {session.title || `Session ${session.id.slice(0, 8)}`}
                            </h3>
                            {currentSessionId === session.id && (
                              <Badge variant="default" className="text-xs">
                                Current
                              </Badge>
                            )}
                            {session.is_paused && (
                              <Badge variant="secondary" className="text-xs">
                                Paused
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {session.turn_count} turns
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleSessionExport(session, e)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleSessionDelete(session.id, e)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};