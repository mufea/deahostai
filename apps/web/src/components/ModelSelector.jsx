import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Atom, Cpu, Hexagon, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export const AI_MODELS = [
  // Text Models
  { 
    id: 'openai', 
    name: 'OpenAI', 
    category: 'text',
    description: 'GPT-4o model, excellent for logic and creative writing',
    icon: Sparkles, 
    badgeClass: 'model-badge-openai',
    iconColor: 'text-[hsl(var(--model-openai))]'
  },
  { 
    id: 'claude', 
    name: 'Claude Sonnet 4', 
    category: 'text',
    description: 'Claude Sonnet 4, superior nuanced understanding and coding',
    icon: Brain, 
    badgeClass: 'model-badge-claude',
    iconColor: 'text-[hsl(var(--model-claude))]'
  },
  { 
    id: 'gemini', 
    name: 'Gemini 2.5', 
    category: 'text',
    description: 'Flash 2.5, incredibly fast and multimodal reasoning',
    icon: Atom, 
    badgeClass: 'model-badge-gemini',
    iconColor: 'text-[hsl(var(--model-gemini))]'
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek', 
    category: 'text',
    description: 'DeepSeek Chat, highly efficient logic engine',
    icon: Cpu, 
    badgeClass: 'model-badge-deepseek',
    iconColor: 'text-[hsl(var(--model-deepseek))]'
  },
  { 
    id: 'xai', 
    name: 'Grok 4', 
    category: 'text',
    description: 'Grok 4, fast and unfiltered insights',
    icon: Hexagon, 
    badgeClass: 'model-badge-xai',
    iconColor: 'text-[hsl(var(--model-xai))]'
  },
  
  // Image Models
  { 
    id: 'dalle3', 
    name: 'DALL-E 3', 
    category: 'image', 
    description: 'Advanced image generation by OpenAI', 
    icon: '🎨', 
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300', 
    iconColor: 'text-orange-500' 
  },
  { 
    id: 'dall-e-2', 
    name: 'DALL-E 2', 
    category: 'image', 
    description: 'High-quality image generation', 
    icon: '🎨', 
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', 
    iconColor: 'text-blue-500' 
  },
  { 
    id: 'sd3', 
    name: 'Stable Diffusion 3', 
    category: 'image', 
    description: 'Advanced image generation with style control', 
    icon: '🎨', 
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300', 
    iconColor: 'text-purple-500' 
  },
  { 
    id: 'flux-pro', 
    name: 'Flux Pro', 
    category: 'image', 
    description: 'Fast and powerful image generation', 
    icon: '⚡', 
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300', 
    iconColor: 'text-yellow-500' 
  },
  { 
    id: 'nano-banana-2', 
    name: 'Nano Banana 2', 
    category: 'image', 
    description: 'Lightweight image generation', 
    icon: '🍌', 
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300', 
    iconColor: 'text-green-500' 
  }
];

export function getModelConfig(modelId) {
  if (modelId === 'claude-4' || modelId === 'claude-3-5-sonnet' || modelId === 'claude-sonnet-4') {
    modelId = 'claude';
  }
  if (modelId === 'gemini-2.5-flash') {
    modelId = 'gemini';
  }
  if (modelId === 'grok-4') {
    modelId = 'xai';
  }
  return AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0];
}

const renderIcon = (IconProp, className) => {
  if (typeof IconProp === 'string') {
    return <span className={cn("inline-flex items-center justify-center text-sm", className)}>{IconProp}</span>;
  }
  const Comp = IconProp;
  return <Comp className={className} />;
};

export default function ModelSelector({ selectedModel, onModelChange, disabled = false, category = 'text' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const availableModels = AI_MODELS.filter(m => m.category === category || (!m.category && category === 'text'));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeModel = availableModels.find(m => m.id === selectedModel) || availableModels[0] || AI_MODELS[0];

  const handleSelect = (modelId) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full sm:w-[280px] h-12 px-4 rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200",
          !disabled && "hover:border-primary/50 hover:bg-accent/30",
          isOpen && "border-primary ring-1 ring-primary/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-1.5 rounded-md flex items-center justify-center w-7 h-7 bg-background", activeModel.badgeClass)}>
            {renderIcon(activeModel.icon, "w-4 h-4")}
          </div>
          <span className="font-medium text-sm">{activeModel.name}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-50 top-full left-0 w-full sm:w-[320px] mt-2 bg-card rounded-xl border shadow-lg overflow-hidden"
          >
            <div className="p-1 max-h-[400px] overflow-y-auto">
              {availableModels.map((model) => {
                const isSelected = selectedModel === model.id || (selectedModel === 'claude-4' && model.id === 'claude');
                
                return (
                  <button
                    key={model.id}
                    onClick={() => handleSelect(model.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors duration-150 group",
                      isSelected ? "bg-accent/50" : "hover:bg-muted"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-1.5 rounded-md mt-0.5 transition-colors flex items-center justify-center w-7 h-7",
                        isSelected ? model.badgeClass : "bg-background border text-muted-foreground group-hover:" + model.iconColor
                      )}>
                        {renderIcon(model.icon, "w-4 h-4")}
                      </div>
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-sm font-medium transition-colors",
                          isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        )}>
                          {model.name}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          {model.description}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary ml-2 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}