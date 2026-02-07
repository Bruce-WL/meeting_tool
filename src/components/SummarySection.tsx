import React from 'react';
import { Target, Cpu, Palette, Sparkles, Users, Shield, LucideIcon } from 'lucide-react';
import { SummaryCard as SummaryCardType } from '../types/meeting';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Target: Target,
  Cpu: Cpu,
  Palette: Palette,
  Sparkles: Sparkles,
  Users: Users,
  Shield: Shield,
};

interface SummarySectionProps {
  cards: SummaryCardType[];
}

const SummarySection: React.FC<SummarySectionProps> = ({ cards }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {cards.map((card) => {
        const IconComponent = iconMap[card.icon] || Target;
        
        return (
          <div 
            key={card.id} 
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
          >
            {/* Card Header */}
            <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <IconComponent className="w-5 h-5 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900">{card.title}</h3>
              </div>
              <span className="bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {card.type}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 mx-5"></div>

            {/* Card Content */}
            <div className="p-5 pt-4 flex-grow">
              <ul className="space-y-3">
                {card.points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-600 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummarySection;
