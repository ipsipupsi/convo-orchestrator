import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Settings } from 'lucide-react';
import { AI_PROVIDERS, AIProvider } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSubmit: (config: AIConfig) => Promise<void>;
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  modelA: string;
  modelB: string;
}

export const SettingsModal = ({ isOpen, onClose, onConfigSubmit }: SettingsModalProps) => {
  const [config, setConfig] = useState<AIConfig>({
    provider: '',
    apiKey: '',
    modelA: '',
    modelB: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const provider = AI_PROVIDERS.find(p => p.value === config.provider);
    setSelectedProvider(provider || null);
    
    // Reset model selections when provider changes
    if (provider && (!config.modelA || !config.modelB)) {
      setConfig(prev => ({
        ...prev,
        modelA: provider.models[0]?.value || '',
        modelB: provider.models[Math.min(1, provider.models.length - 1)]?.value || provider.models[0]?.value || '',
      }));
    }
  }, [config.provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!config.provider || !config.apiKey || !config.modelA || !config.modelB) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfigSubmit(config);
      toast({
        title: 'Configuration Saved',
        description: 'AI models configured successfully. Starting new session...',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Configuration Error',
        description: 'Failed to configure AI models. Please check your settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings className="w-5 h-5" />
            AI Model Configuration
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider" className="text-foreground">AI Provider</Label>
              <Select 
                value={config.provider} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, provider: value }))}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select an AI provider" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {AI_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-foreground">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                className="bg-input border-border"
              />
              <p className="text-xs text-muted-foreground">
                Your API key is used to authenticate with the selected provider
              </p>
            </div>

            {/* Model A Selection */}
            {selectedProvider && (
              <div className="space-y-2">
                <Label htmlFor="modelA" className="text-foreground">Model A</Label>
                <Select 
                  value={config.modelA} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, modelA: value }))}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select model for Chat Panel 1" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {selectedProvider.models.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Model B Selection */}
            {selectedProvider && (
              <div className="space-y-2">
                <Label htmlFor="modelB" className="text-foreground">Model B</Label>
                <Select 
                  value={config.modelB} 
                  onValueChange={(value) => setConfig(prev => ({ ...prev, modelB: value }))}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Select model for Chat Panel 2" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {selectedProvider.models.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Configuring...
                </>
              ) : (
                'Start Session'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};