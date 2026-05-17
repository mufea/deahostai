import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Trash2, Clock, MessageSquare, Zap } from 'lucide-react';
import { getModelConfig } from './ModelSelector.jsx';
import { cn } from '@/lib/utils.js';

export default function GenerationHistory({ 
  history, 
  onLoadHistory, 
  onDeleteItem, 
  onClearAll, 
  currentItemId 
}) {
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all generation history? This cannot be undone.')) {
      onClearAll();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2 text-foreground">
          <Clock className="w-4 h-4 text-primary" />
          Recent Generations
        </h3>
        {history.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearAll}
            className="h-8 text-xs text-muted-foreground hover:text-destructive"
          >
            Clear All
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground opacity-70">
            <MessageSquare className="w-8 h-8 mb-3 stroke-[1.5]" />
            <p className="text-sm">No history yet</p>
            <p className="text-xs mt-1">Your generated texts will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => {
              const modelConfig = getModelConfig(item.model || 'openai');
              const ModelIcon = modelConfig.icon;

              return (
                <div 
                  key={item.id}
                  onClick={() => onLoadHistory(item)}
                  className={cn(
                    "history-item-card group",
                    currentItemId === item.id && "active"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {formatTime(item.timestamp)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2 -mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      aria-label="Delete history item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  
                  <p className="text-sm font-medium text-foreground line-clamp-2 mb-1.5 leading-snug">
                    {item.prompt}
                  </p>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                    {item.response}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-auto">
                    <div className={cn("model-badge text-[10px] px-1.5 py-0", modelConfig.badgeClass)}>
                      <ModelIcon className="w-3 h-3" />
                      {modelConfig.name}
                    </div>
                    {item.tokensUsed > 0 && (
                      <div className="flex items-center gap-1 text-[10px] font-medium text-primary/80 bg-primary/10 w-fit px-2 py-0.5 rounded-full">
                        <Zap className="w-3 h-3" />
                        {item.tokensUsed}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}