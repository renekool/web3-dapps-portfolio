import React from 'react';
import { Check, Loader2 } from 'lucide-react';

interface VoteOptionCardProps {
  type: 'FOR' | 'AGAINST' | 'ABSTAIN';
  title: string;
  description: string;
  votes: string | number;
  percentage: number;
  isSelected: boolean;
  isVoting: boolean;
  isAnyVoting: boolean;
  onVote: () => void;
  canVote?: boolean;
}

export const VoteOptionCard: React.FC<VoteOptionCardProps> = ({
  type,
  title,
  description,
  votes,
  percentage,
  isSelected,
  isVoting,
  isAnyVoting,
  onVote,
  canVote = true,
}) => {
  // Configuración de estilos según el tipo
  const configs = {
    FOR: {
      activeBg: 'bg-emerald-50/50 border-emerald-500 shadow-sm',
      hoverBorder: 'hover:border-emerald-200',
      titleActive: 'text-emerald-700',
      titleDefault: 'text-emerald-600',
      iconBg: 'bg-emerald-600',
      buttonActive: 'bg-emerald-700',
      progressBg: 'bg-emerald-500'
    },
    AGAINST: {
      activeBg: 'bg-rose-50/50 border-rose-500 shadow-sm',
      hoverBorder: 'hover:border-rose-200',
      titleActive: 'text-rose-700',
      titleDefault: 'text-rose-500',
      iconBg: 'bg-rose-600',
      buttonActive: 'bg-rose-700',
      progressBg: 'bg-rose-500'
    },
    ABSTAIN: {
      activeBg: 'bg-slate-50/50 border-slate-400 shadow-sm',
      hoverBorder: 'hover:border-slate-300',
      titleActive: 'text-slate-700',
      titleDefault: 'text-slate-600',
      iconBg: 'bg-slate-600',
      buttonActive: 'bg-slate-700',
      progressBg: 'bg-slate-400'
    }
  };

  const config = configs[type];

  return (
    <div className={`p-5 rounded-2xl border-2 transition-all duration-200 ${
      isSelected 
        ? config.activeBg 
        : `bg-white border-slate-200 ${config.hoverBorder} shadow-sm`
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className={`font-bold text-lg flex items-center gap-2 ${isSelected ? config.titleActive : config.titleDefault}`}>
            {title}
          </h4>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        {isSelected && (
          <div className={`${config.iconBg} text-white rounded-full p-0.5`}>
            <Check className="size-4" strokeWidth={3} />
          </div>
        )}
      </div>
      
      {/* Percentage Row */}
      <div className="flex items-end justify-between mt-4">
        <div>
          <div className="text-3xl font-display font-bold text-slate-900 leading-none mb-1">{percentage.toFixed(2)}%</div>
          <div className="text-xs font-medium text-slate-500">{votes} votes</div>
        </div>
        <button 
          onClick={() => (isSelected || isAnyVoting || !canVote) ? null : onVote()}
          disabled={isSelected || isAnyVoting || !canVote}
          className={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-200 flex items-center gap-2 ${
            isSelected
              ? `${config.buttonActive} text-white shadow-inner cursor-default`
              : (isAnyVoting || !canVote)
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-white border border-slate-900 text-slate-900 hover:bg-slate-50 active:scale-[0.98] cursor-pointer'
          }`}
        >
          {isVoting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isSelected ? (
            <Check className="size-4" />
          ) : null}
          {isVoting ? 'Voting...' : (isSelected ? 'Voted' : 'Vote')}
        </button>
      </div>
    </div>
  );
};
