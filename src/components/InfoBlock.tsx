import React from 'react';
import { cn } from '../lib/utils';

interface InfoBlockProps {
  title: string;
  items: string[];
  color: 'orange' | 'yellow';
}

const InfoBlock: React.FC<InfoBlockProps> = ({ title, items, color }) => {
  const accentClass = color === 'orange' ? 'bg-orange-500' : 'bg-yellow-500';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
        <span className={cn("w-1 h-6 rounded-full", accentClass)}></span>
        {title}
      </h2>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-gray-400" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InfoBlock;
