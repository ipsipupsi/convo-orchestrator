import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Play, Pause, MessageSquarePlus, RotateCcw, Download, Target } from 'lucide-react';
import { SessionState } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

interface OverseerPanelProps {
  sessionState: SessionState | null;
  onPause: () => void;
  onResume: () => void;
  onInjectNote: (note: string, targetModel: 'A' | 'B' | 'All') => void;
  onStartNewSession: () => void;
  onExportSession: () => void;
}

export const OverseerPanel = ({
  sessionState,
  onPause,
  onResume,
  onInjectNote,
  onStartNewSession,
  onExportSession,
}: OverseerPanelProps) => {
  const [note, setNote] = useState('');
  const [targetModel, setTargetModel] = useState<'A' | 'B' | 'All'>('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitNote = async () => {
    if (!note.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onInjectNote(note.trim(), targetModel);
      setNote('');
      toast({
        title: 'Note injected',
        description: `Your note has been sent to ${targetModel === 'All' ? 'both models' : `Model ${targetModel}`}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to inject note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitNote();
    }
  };

  return (
    <Card className="bg-card border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">AI Steering Hub</h2>
        </div>
        <p className="text-sm text-muted-foreground">Oversee and control the conversation</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Session Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Session Status</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Status:</span>
              <Badge 
                variant={sessionState?.isActive ? 'default' : 'secondary'}
                className={sessionState?.isActive ? 'bg-success text-success-foreground' : ''}
              >
                {sessionState?.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">State:</span>
              <Badge 
                variant={sessionState?.isPaused ? 'destructive' : 'secondary'}
              >
                {sessionState?.isPaused ? 'Paused' : 'Running'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Turn:</span>
              <span className="font-mono">{sessionState?.turnCount || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Notes:</span>
              <span className="font-mono">{sessionState?.pendingNotes?.length || 0}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Control Buttons */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Controls</h3>
          <div className="flex gap-2">
            {sessionState?.isPaused ? (
              <Button 
                onClick={onResume} 
                size="sm" 
                className="flex-1"
                disabled={!sessionState?.isActive}
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            ) : (
              <Button 
                onClick={onPause} 
                size="sm" 
                variant="secondary" 
                className="flex-1"
                disabled={!sessionState?.isActive}
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={onStartNewSession} 
              size="sm" 
              variant="outline" 
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Session
            </Button>
            <Button 
              onClick={onExportSession} 
              size="sm" 
              variant="outline" 
              className="flex-1"
              disabled={!sessionState?.isActive}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Separator />

        {/* Note Injection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">Inject Context</h3>
            <Badge variant="outline" className="text-xs">Enhanced</Badge>
          </div>
          <div className="space-y-3">
            {/* Target Model Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Target Model:</Label>
              <RadioGroup
                value={targetModel}
                onValueChange={(value: 'A' | 'B' | 'All') => setTargetModel(value)}
                className="flex gap-6"
                disabled={!sessionState?.isActive}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="A" id="model-a" />
                  <Label htmlFor="model-a" className="text-sm cursor-pointer">Model A</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="B" id="model-b" />
                  <Label htmlFor="model-b" className="text-sm cursor-pointer">Model B</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="All" id="model-all" />
                  <Label htmlFor="model-all" className="text-sm cursor-pointer">Both</Label>
                </div>
              </RadioGroup>
            </div>
            
            <Textarea
              placeholder={`Add context or steering instructions for ${targetModel === 'All' ? 'both models' : `Model ${targetModel}`}...`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] resize-none"
              disabled={!sessionState?.isActive}
            />
            <Button 
              onClick={handleSubmitNote}
              size="sm"
              className="w-full"
              disabled={!note.trim() || isSubmitting || !sessionState?.isActive}
            >
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Injecting...' : `Inject to ${targetModel === 'All' ? 'Both Models' : `Model ${targetModel}`}`}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Tip: Use Ctrl+Enter to quickly submit your note
            </p>
          </div>
        </div>

        {/* Pending Notes */}
        {sessionState?.pendingNotes && sessionState.pendingNotes.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Pending Notes</h3>
                <Badge variant="secondary" className="text-xs">
                  {sessionState.pendingNotes.length}
                </Badge>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {sessionState.pendingNotes.map((pendingNote, index) => (
                  <div 
                    key={index}
                    className="text-xs p-2 bg-muted/50 rounded border border-border/50"
                  >
                    {pendingNote}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};