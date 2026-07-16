import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// A small ℹ affordance that reveals a short explanation on hover/focus. Used to
// gloss FAIR terminology and other concepts inline without cluttering the UI.
// Renders nothing when there is no text, so callers can pass an optional key.
export default function InfoTip({ text, className = '', side = 'top' }) {
  if (!text) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={text}
          onClick={(e) => e.preventDefault()}
          className={cn('inline-flex text-muted-foreground hover:text-foreground focus:outline-hidden', className)}
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
