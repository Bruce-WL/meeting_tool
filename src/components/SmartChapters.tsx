import React from 'react';
import { PlayCircle } from 'lucide-react';
import { SmartChapter } from '../types/meeting';

interface SmartChaptersProps {
  chapters: SmartChapter[];
}

const SmartChapters: React.FC<SmartChaptersProps> = ({ chapters }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-green-500 rounded-full"></span>
        智能章节
      </h2>
      <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="relative pl-8">
            {/* Timeline dot */}
            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-gray-300"></div>
            
            <div className="flex flex-col sm:flex-row sm:gap-6">
              <div className="flex-shrink-0 mb-2 sm:mb-0">
                <button className="flex items-center gap-1.5 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">
                  <PlayCircle className="w-3.5 h-3.5" />
                  {chapter.timestamp}
                </button>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{chapter.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {chapter.summary}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartChapters;
