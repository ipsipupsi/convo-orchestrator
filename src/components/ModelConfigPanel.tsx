import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, Bot } from 'lucide-react';
import { AI_PROVIDERS, AIProvider } from '@/lib/socket';

export interface ModelConfig {
  provider: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface ModelConfigPanelProps {
  title: string;
  modelType: 'A' | 'B';
  config: ModelConfig | null;
  onConfigChange: (config: ModelConfig) => void;
  className?: string;
}

export const ModelConfigPanel = ({ 
  title, 
  modelType, 
  config, 
  onConfigChange,
  className 
}: ModelConfigPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [localConfig, setLocalConfig] = useState<ModelConfig>({
    provider: '',
    apiKey: '',
    model: '',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: ''
  });

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
      const provider = AI_PROVIDERS.find(p => p.value === config.provider);
      setSelectedProvider(provider || null);
    }
  }, [config]);

  useEffect(() => {
    const provider = AI_PROVIDERS.find(p => p.value === localConfig.provider);
    setSelectedProvider(provider || null);
    
    // Auto-select first model when provider changes
    if (provider && !localConfig.model) {
      const updatedConfig = {
        ...localConfig,
        model: provider.models[0]?.value || ''
      };
      setLocalConfig(updatedConfig);
      onConfigChange(updatedConfig);
    }
  }, [localConfig.provider]);

  const handleConfigUpdate = (updates: Partial<ModelConfig>) => {
    const updatedConfig = { ...localConfig, ...updates };
    setLocalConfig(updatedConfig);
    onConfigChange(updatedConfig);
  };

  const isConfigured = localConfig.provider && localConfig.apiKey && localConfig.model;

  return (
    <Card className={`transition-all duration-200 ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">{title}</h3>
            <Badge variant={isConfigured ? "default" : "secondary"}>
              Model {modelType}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Status */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Provider:</span>
            <span className="font-medium">
              {selectedProvider?.label || 'Not configured'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Model:</span>
            <span className="font-medium">
              {selectedProvider?.models.find(m => m.value === localConfig.model)?.label || 'Not selected'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">API Key:</span>
            <span className="flex items-center gap-1">
              {localConfig.apiKey ? (
                <>
                  <Key className="w-3 h-3 text-success" />
                  <span className="text-success text-xs">Configured</span>
                </>
              ) : (
                <span className="text-destructive text-xs">Missing</span>
              )}
            </span>
          </div>
        </div>

        {/* Expanded Configuration */}
        {isExpanded && (
          <div className="space-y-4 pt-3 border-t border-border">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">AI Provider</Label>
              <Select 
                value={localConfig.provider} 
                onValueChange={(value) => handleConfigUpdate({ provider: value, model: '' })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
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
              <Label className="text-xs font-medium">API Key</Label>
              <Input
                type="password"
                placeholder="Enter API key"
                value={localConfig.apiKey}
                onChange={(e) => handleConfigUpdate({ apiKey: e.target.value })}
                className="h-8"
              />
            </div>

            {/* Model Selection */}
            {selectedProvider && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Model</Label>
                <Select 
                  value={localConfig.model} 
                  onValueChange={(value) => handleConfigUpdate({ model: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProvider.models.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Advanced Settings */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Temperature</Label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={localConfig.temperature}
                  onChange={(e) => handleConfigUpdate({ temperature: parseFloat(e.target.value) })}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Max Tokens</Label>
                <Input
                  type="number"
                  min="1"
                  max="8192"
                  value={localConfig.maxTokens}
                  onChange={(e) => handleConfigUpdate({ maxTokens: parseInt(e.target.value) })}
                  className="h-8"
                />
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">System Prompt (Optional)</Label>
              <Input
                placeholder="Custom system prompt..."
                value={localConfig.systemPrompt}
                onChange={(e) => handleConfigUpdate({ systemPrompt: e.target.value })}
                className="h-8"
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};