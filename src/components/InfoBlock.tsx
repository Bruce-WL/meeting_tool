import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface InfoBlockProps {
  title: string;
  items: string[];
  icon: LucideIcon;
  color: 'orange' | 'yellow';
}

const InfoBlock: React.FC<InfoBlockProps> = ({ title, items, icon: Icon, color }) => {
  const bgClass = color === 'orange' ? 'bg-orange-50' : 'bg-yellow-50';
  const textClass = color === 'orange' ? 'text-orange-800' : 'text-yellow-800';
  const iconClass = color === 'orange' ? 'text-orange-600' : 'text-yellow-600';
  const borderClass = color === 'orange' ? 'border-orange-100' : 'border-yellow-100';

  return (
    <div className={cn("rounded-2xl border p-6 h-full", bgClass, borderClass)}>
      <h2 className={cn("text-lg font-bold mb-4 flex items-center gap-2", textClass)}>
        <Icon className={cn("w-5 h-5", iconClass)} />
        {title}
      </h2>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className={cn("flex items-start gap-2.5 text-sm", textClass)}>
            <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-current opacity-60")} />
            <span className="leading-relaxed opacity-90">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InfoBlock;
