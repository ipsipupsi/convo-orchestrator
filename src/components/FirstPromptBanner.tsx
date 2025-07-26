import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';

interface FirstPromptBannerProps {
  onSendFirstMessage: (message: string, targetModel: 'A' | 'B') => void;
  isLoading: boolean;
}

export const FirstPromptBanner = ({ onSendFirstMessage, isLoading }: FirstPromptBannerProps) => {
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<'A' | 'B'>('A');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendFirstMessage(message.trim(), selectedModel);
      setMessage('');
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <MessageSquare className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Start Your Conversation
            </h3>
            <p className="text-sm text-muted-foreground">
              Send the first message to begin your AI steering session. Choose which model should respond first, or configure both models to compare their responses.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder="Type your first message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Target Model:</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={selectedModel === 'A' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedModel('A')}
                    disabled={isLoading}
                  >
                    Model A
                  </Button>
                  <Button
                    type="button"
                    variant={selectedModel === 'B' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedModel('B')}
                    disabled={isLoading}
                  >
                    Model B
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={!message.trim() || isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send First Message
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Card>
  );
};