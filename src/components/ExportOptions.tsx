import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileText, 
  FileJson, 
  FileSpreadsheet, 
  Share2,
  Copy,
  Mail
} from 'lucide-react';
import { ChatSession, ChatMessage } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ExportOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession | null;
  messages: ChatMessage[];
}

interface ExportConfig {
  format: 'json' | 'txt' | 'csv' | 'md';
  includeMetadata: boolean;
  includeTimestamps: boolean;
  includeModelInfo: boolean;
  includeCostData: boolean;
  filterByModel: 'all' | 'A' | 'B' | 'user';
}

export const ExportOptions = ({ isOpen, onClose, session, messages }: ExportOptionsProps) => {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'json',
    includeMetadata: true,
    includeTimestamps: true,
    includeModelInfo: true,
    includeCostData: false,
    filterByModel: 'all',
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const formatOptions = [
    { value: 'json', label: 'JSON', icon: FileJson, description: 'Structured data format' },
    { value: 'txt', label: 'Text', icon: FileText, description: 'Plain text conversation' },
    { value: 'csv', label: 'CSV', icon: FileSpreadsheet, description: 'Spreadsheet format' },
    { value: 'md', label: 'Markdown', icon: FileText, description: 'Formatted text with styling' },
  ];

  const filterMessages = (messages: ChatMessage[]) => {
    if (config.filterByModel === 'all') return messages;
    return messages.filter(msg => msg.model_type === config.filterByModel);
  };

  const generateExportData = () => {
    const filteredMessages = filterMessages(messages);
    
    const exportData = {
      ...(config.includeMetadata && {
        session: {
          id: session?.id,
          title: session?.title,
          created_at: session?.created_at,
          turn_count: session?.turn_count,
          is_paused: session?.is_paused,
        },
        export_info: {
          exported_at: new Date().toISOString(),
          format: config.format,
          message_count: filteredMessages.length,
          filter: config.filterByModel,
        },
      }),
      messages: filteredMessages.map(msg => ({
        id: msg.id,
        model_type: msg.model_type,
        content: msg.content,
        ...(config.includeTimestamps && { created_at: msg.created_at }),
        ...(config.includeModelInfo && { 
          model_info: {
            type: msg.model_type,
            is_ai: msg.model_type !== 'user',
          }
        }),
      })),
    };

    return exportData;
  };

  const exportAsJSON = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    return blob;
  };

  const exportAsText = (data: any) => {
    let content = '';
    
    if (config.includeMetadata && data.session) {
      content += `Session: ${data.session.title || data.session.id}\n`;
      content += `Created: ${new Date(data.session.created_at).toLocaleString()}\n`;
      content += `Turn Count: ${data.session.turn_count}\n\n`;
      content += '=' .repeat(50) + '\n\n';
    }

    data.messages.forEach((msg: any, index: number) => {
      const speaker = msg.model_type === 'user' ? 'User' : 
                    msg.model_type === 'A' ? 'Model A' : 
                    msg.model_type === 'B' ? 'Model B' : 'System';
      
      content += `${speaker}`;
      if (config.includeTimestamps && msg.created_at) {
        content += ` (${new Date(msg.created_at).toLocaleString()})`;
      }
      content += ':\n';
      content += msg.content + '\n\n';
    });

    const blob = new Blob([content], { type: 'text/plain' });
    return blob;
  };

  const exportAsCSV = (data: any) => {
    const headers = ['Index', 'Speaker', 'Content'];
    if (config.includeTimestamps) headers.push('Timestamp');
    if (config.includeModelInfo) headers.push('Model Type');

    let csv = headers.join(',') + '\n';

    data.messages.forEach((msg: any, index: number) => {
      const speaker = msg.model_type === 'user' ? 'User' : 
                    msg.model_type === 'A' ? 'Model A' : 
                    msg.model_type === 'B' ? 'Model B' : 'System';
      
      const row = [
        index + 1,
        `"${speaker}"`,
        `"${msg.content.replace(/"/g, '""')}"`,
      ];

      if (config.includeTimestamps) {
        row.push(`"${msg.created_at || ''}"`);
      }
      if (config.includeModelInfo) {
        row.push(`"${msg.model_type}"`);
      }

      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    return blob;
  };

  const exportAsMarkdown = (data: any) => {
    let content = '';
    
    if (config.includeMetadata && data.session) {
      content += `# ${data.session.title || 'AI Steering Session'}\n\n`;
      content += `**Session ID:** ${data.session.id}\n`;
      content += `**Created:** ${new Date(data.session.created_at).toLocaleString()}\n`;
      content += `**Turn Count:** ${data.session.turn_count}\n\n`;
      content += '---\n\n';
    }

    data.messages.forEach((msg: any) => {
      const speaker = msg.model_type === 'user' ? '👤 **User**' : 
                    msg.model_type === 'A' ? '🤖 **Model A**' : 
                    msg.model_type === 'B' ? '🤖 **Model B**' : '⚙️ **System**';
      
      content += `${speaker}`;
      if (config.includeTimestamps && msg.created_at) {
        content += ` *(${new Date(msg.created_at).toLocaleString()})*`;
      }
      content += '\n\n';
      content += msg.content + '\n\n';
      content += '---\n\n';
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    return blob;
  };

  const handleExport = async () => {
    if (!session) return;

    setIsExporting(true);
    try {
      const data = generateExportData();
      let blob: Blob;
      let filename: string;

      switch (config.format) {
        case 'json':
          blob = exportAsJSON(data);
          filename = `ai-steering-session-${session.id.slice(0, 8)}.json`;
          break;
        case 'txt':
          blob = exportAsText(data);
          filename = `ai-steering-session-${session.id.slice(0, 8)}.txt`;
          break;
        case 'csv':
          blob = exportAsCSV(data);
          filename = `ai-steering-session-${session.id.slice(0, 8)}.csv`;
          break;
        case 'md':
          blob = exportAsMarkdown(data);
          filename = `ai-steering-session-${session.id.slice(0, 8)}.md`;
          break;
        default:
          throw new Error('Unsupported format');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: `Session exported as ${config.format.toUpperCase()}`,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export session data.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const data = generateExportData();
      const text = config.format === 'json' 
        ? JSON.stringify(data, null, 2)
        : exportAsText(data);
      
      await navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(data));
      
      toast({
        title: 'Copied to Clipboard',
        description: 'Session data copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const selectedFormat = formatOptions.find(f => f.value === config.format);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <Select value={config.format} onValueChange={(value: any) => setConfig(prev => ({ ...prev, format: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Message Filter</Label>
            <Select value={config.filterByModel} onValueChange={(value: any) => setConfig(prev => ({ ...prev, filterByModel: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="user">User Messages Only</SelectItem>
                <SelectItem value="A">Model A Messages Only</SelectItem>
                <SelectItem value="B">Model B Messages Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Include Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include in Export</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={config.includeMetadata}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeMetadata: !!checked }))}
                />
                <Label htmlFor="metadata" className="text-sm">Session metadata</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timestamps"
                  checked={config.includeTimestamps}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeTimestamps: !!checked }))}
                />
                <Label htmlFor="timestamps" className="text-sm">Message timestamps</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="modelInfo"
                  checked={config.includeModelInfo}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeModelInfo: !!checked }))}
                />
                <Label htmlFor="modelInfo" className="text-sm">Model information</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="costData"
                  checked={config.includeCostData}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeCostData: !!checked }))}
                />
                <Label htmlFor="costData" className="text-sm">Cost & performance data</Label>
                <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleExport} 
              disabled={isExporting || !session}
              className="flex-1"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export {selectedFormat?.label}
            </Button>

            <Button 
              variant="outline" 
              onClick={handleCopyToClipboard}
              disabled={!session}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          {/* Preview Info */}
          {session && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
              <div className="flex items-center justify-between">
                <span>Messages to export:</span>
                <Badge variant="outline" className="text-xs">
                  {filterMessages(messages).length}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};