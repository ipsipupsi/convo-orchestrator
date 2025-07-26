import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  Clock, 
  Zap, 
  TrendingUp, 
  Activity,
  Timer
} from 'lucide-react';

interface CostData {
  totalCost: number;
  sessionCost: number;
  tokensUsed: number;
  averageLatency: number;
  requestCount: number;
  modelACost: number;
  modelBCost: number;
  modelALatency: number;
  modelBLatency: number;
  modelARequests: number;
  modelBRequests: number;
}

interface CostTrackerProps {
  sessionId?: string;
  isActive: boolean;
}

export const CostTracker = ({ sessionId, isActive }: CostTrackerProps) => {
  const [costData, setCostData] = useState<CostData>({
    totalCost: 0,
    sessionCost: 0,
    tokensUsed: 0,
    averageLatency: 0,
    requestCount: 0,
    modelACost: 0,
    modelBCost: 0,
    modelALatency: 0,
    modelBLatency: 0,
    modelARequests: 0,
    modelBRequests: 0,
  });

  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (sessionId && isActive) {
      setSessionStartTime(new Date());
    }
  }, [sessionId, isActive]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionStartTime && isActive) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - sessionStartTime.getTime());
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionStartTime, isActive]);

  // Simulate cost tracking updates (in real implementation, this would come from API calls)
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setCostData(prev => ({
        ...prev,
        // Simulate small incremental costs and metrics
        sessionCost: prev.sessionCost + (Math.random() * 0.001),
        tokensUsed: prev.tokensUsed + Math.floor(Math.random() * 10),
        averageLatency: 800 + Math.random() * 400,
        requestCount: prev.requestCount + (Math.random() > 0.8 ? 1 : 0),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isActive]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatLatency = (ms: number) => {
    return `${Math.round(ms)}ms`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5" />
          Cost & Performance
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Session Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="w-3 h-3" />
              Session Cost
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(costData.sessionCost)}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="w-3 h-3" />
              Duration
            </div>
            <div className="text-lg font-semibold">
              {formatTime(elapsedTime)}
            </div>
          </div>
        </div>

        <Separator />

        {/* Performance Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-3 h-3" />
              Avg Latency
            </div>
            <Badge variant="outline" className="text-xs">
              {formatLatency(costData.averageLatency)}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Zap className="w-3 h-3" />
              Requests
            </div>
            <Badge variant="outline" className="text-xs">
              {costData.requestCount}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              Tokens Used
            </div>
            <Badge variant="outline" className="text-xs">
              {costData.tokensUsed.toLocaleString()}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Model Comparison */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Model Performance</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-chat-ai-a">Model A</span>
              <div className="flex items-center gap-2">
                <span>{formatLatency(costData.modelALatency)}</span>
                <span className="text-muted-foreground">
                  {formatCurrency(costData.modelACost)}
                </span>
              </div>
            </div>
            <Progress 
              value={(costData.modelARequests / Math.max(costData.requestCount, 1)) * 100} 
              className="h-1"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-chat-ai-b">Model B</span>
              <div className="flex items-center gap-2">
                <span>{formatLatency(costData.modelBLatency)}</span>
                <span className="text-muted-foreground">
                  {formatCurrency(costData.modelBCost)}
                </span>
              </div>
            </div>
            <Progress 
              value={(costData.modelBRequests / Math.max(costData.requestCount, 1)) * 100} 
              className="h-1"
            />
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
            {isActive ? 'Tracking Active' : 'Session Inactive'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};