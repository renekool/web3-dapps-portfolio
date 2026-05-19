import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface GovernanceCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  unit?: string;
  animateValue?: boolean;
}

export const GovernanceCard: React.FC<GovernanceCardProps> = ({
  icon: Icon,
  title,
  value,
  unit,
  animateValue = false
}) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isEth = unit === 'ETH';
  const decimals = isEth ? 4 : 0;

  const formattedValue = mounted && typeof value === 'number' 
    ? value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : typeof value === 'number' ? value.toFixed(decimals) : value;

  return (
    <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
      <p className="font-medium text-slate-500 text-sm mb-2 flex items-center gap-2">
        <Icon className="size-4 text-slate-400 group-hover:text-dark-green transition-colors" />
        {title}
      </p>
      <motion.div
        key={animateValue ? String(value) : undefined}
        initial={animateValue ? { opacity: 0, scale: 0.95 } : {}}
        animate={animateValue ? { opacity: 1, scale: 1 } : {}}
        className="flex items-baseline gap-1.5 overflow-hidden"
      >
        <p className={`font-display font-bold text-slate-900 truncate ${
          formattedValue.length > 8 ? 'text-2xl' : 'text-3xl'
        }`}>
          {formattedValue}
        </p>
        {unit && (
          <span className={`font-bold text-slate-500 shrink-0 ${
            formattedValue.length > 8 ? 'text-sm' : 'text-lg'
          }`}>
            {unit}
          </span>
        )}
      </motion.div>
    </div>
  );
};
