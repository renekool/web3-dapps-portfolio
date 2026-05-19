import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description
}) => {
  return (
    <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-typography/5 group">
      <div className="w-16 h-16 bg-section-bg rounded-xl flex items-center justify-center mb-8 group-hover:bg-[#EBF1E6] group-hover:scale-[1.02] transition-all duration-200 ease-in-out">
        <Icon className="text-secondary size-8 group-hover:text-[#1B5B41] transition-colors duration-200" />
      </div>
      <h3 className="text-2xl font-bold mb-4 text-typography font-display">{title}</h3>
      <p className="text-typography/60 leading-relaxed font-body">
        {description}
      </p>
    </div>
  );
};
