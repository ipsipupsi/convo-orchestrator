import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Session Management
  { keys: ['Ctrl', 'N'], description: 'New Session', category: 'Session' },
  { keys: ['Ctrl', 'S'], description: 'Save Session', category: 'Session' },
  { keys: ['Ctrl', 'O'], description: 'Open Sessions', category: 'Session' },
  { keys: ['Ctrl', 'E'], description: 'Export Session', category: 'Session' },
  { keys: ['Ctrl', 'P'], description: 'Pause/Resume Session', category: 'Session' },
  
  // Navigation
  { keys: ['Ctrl', '1'], description: 'Focus Model A', category: 'Navigation' },
  { keys: ['Ctrl', '2'], description: 'Focus Model B', category: 'Navigation' },
  { keys: ['Ctrl', '3'], description: 'Focus Overseer Panel', category: 'Navigation' },
  { keys: ['Tab'], description: 'Next Panel', category: 'Navigation' },
  { keys: ['Shift', 'Tab'], description: 'Previous Panel', category: 'Navigation' },
  
  // Chat Actions
  { keys: ['Ctrl', 'Enter'], description: 'Send Message', category: 'Chat' },
  { keys: ['Ctrl', 'I'], description: 'Inject Note', category: 'Chat' },
  { keys: ['Ctrl', 'R'], description: 'Regenerate Response', category: 'Chat' },
  { keys: ['Ctrl', 'C'], description: 'Copy Last Response', category: 'Chat' },
  
  // Interface
  { keys: ['Ctrl', ','], description: 'Open Settings', category: 'Interface' },
  { keys: ['Ctrl', '/'], description: 'Show Shortcuts', category: 'Interface' },
  { keys: ['Ctrl', 'K'], description: 'Command Palette', category: 'Interface' },
  { keys: ['F11'], description: 'Toggle Fullscreen', category: 'Interface' },
  { keys: ['Escape'], description: 'Close Modal/Cancel', category: 'Interface' },
];

export const KeyboardShortcuts = ({ isOpen, onClose }: KeyboardShortcutsProps) => {
  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  const renderKey = (key: string) => (
    <Badge key={key} variant="outline" className="text-xs px-2 py-1 font-mono">
      {key}
    </Badge>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto">
          {categories.map((category) => (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                {category === 'Session' && <Command className="w-4 h-4" />}
                {category}
              </h3>
              
              <div className="space-y-2">
                {shortcuts
                  .filter(shortcut => shortcut.category === category)
                  .map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            {keyIndex > 0 && <span className="text-xs text-muted-foreground">+</span>}
                            {renderKey(key)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
              
              {category !== categories[categories.length - 1] && <Separator />}
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Press <Badge variant="outline" className="text-xs mx-1">Ctrl</Badge> + 
          <Badge variant="outline" className="text-xs mx-1">/</Badge> to toggle this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook for keyboard shortcuts
export const useKeyboardShortcuts = (handlers: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { ctrlKey, metaKey, shiftKey, key, altKey } = event;
      const modifierKey = ctrlKey || metaKey;
      
      // Build shortcut string
      let shortcut = '';
      if (modifierKey) shortcut += 'ctrl+';
      if (shiftKey) shortcut += 'shift+';
      if (altKey) shortcut += 'alt+';
      shortcut += key.toLowerCase();

      // Handle specific shortcuts
      if (handlers[shortcut]) {
        event.preventDefault();
        handlers[shortcut]();
      }

      // Handle function keys and special keys without modifiers
      if (!modifierKey && !shiftKey && !altKey) {
        if (handlers[key.toLowerCase()]) {
          event.preventDefault();
          handlers[key.toLowerCase()]();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};