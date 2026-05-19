import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface TreasuryCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  unit?: string;
  onAction?: () => void;
  animateValue?: boolean;
}

export const TreasuryCard: React.FC<TreasuryCardProps> = ({
  icon: Icon,
  title,
  value,
  unit,
  onAction,
  animateValue = false
}) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const formattedValue = mounted && typeof value === 'number' 
    ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : typeof value === 'number' ? value.toFixed(2) : value;

  return (
    <div className="rounded-xl bg-dark-green p-6 relative overflow-hidden flex flex-col justify-center shadow-inner group h-full">
      {/* Decorative background elements */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
      <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-all duration-500"></div>
      
      <div className="relative z-10 mb-2">
        <p className="font-medium text-primary/80 text-sm flex items-center gap-2">
          <Icon className="size-4" />
          {title}
        </p>
      </div>
      
      <div className="relative z-10 flex items-center justify-between gap-2">
        <motion.div 
          key={animateValue ? String(value) : undefined}
          initial={animateValue ? { opacity: 0, y: -10 } : {}}
          animate={animateValue ? { opacity: 1, y: 0 } : {}}
          className="flex items-baseline gap-1.5 overflow-hidden flex-1"
        >
          <span 
            className={`font-display font-bold text-primary tracking-tight truncate ${
              formattedValue.length > 8 ? 'text-2xl' : 'text-3xl'
            }`}
          >
            {formattedValue}
          </span>
          {unit && (
            <span className={`font-bold text-primary/70 shrink-0 ${
              formattedValue.length > 8 ? 'text-sm' : 'text-lg'
            }`}>
              {unit}
            </span>
          )}
        </motion.div>
        
        {onAction && (
          <div className="relative shrink-0 flex items-center justify-center p-1">
            <button 
              onClick={onAction}
              className="flex size-7 items-center justify-center rounded-full bg-primary text-dark-green hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-md shadow-primary/20"
              title={`Action for ${title}`}
            >
              <Plus className="size-4 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
