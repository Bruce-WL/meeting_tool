import React, { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { SmartChapter } from '../types/meeting';

interface SmartChaptersProps {
  chapters: SmartChapter[];
}

const SmartChapters: React.FC<SmartChaptersProps> = ({ chapters }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Ensure chapters is always an array
  const safeChapters = Array.isArray(chapters) ? chapters : [];
  
  if (safeChapters.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-green-500 rounded-full"></span>
          智能章节
        </h2>
        <p className="text-gray-500 text-center py-8">暂无智能章节</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-green-500 rounded-full"></span>
        智能章节
      </h2>
      <div className="space-y-6">
        {safeChapters.map((chapter) => {
          const isActive = activeId === chapter.id;
          return (
            <div key={chapter.id} className="grid grid-cols-[96px_1fr] gap-6 items-start">
              <div className="flex-shrink-0">
                <button
                  onClick={() => setActiveId(chapter.id)}
                  className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                    isActive
                      ? 'text-white bg-blue-600'
                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                  }`}
                  aria-pressed={isActive}
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  {chapter.timestamp}
                </button>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{chapter.title || '未命名章节'}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{chapter.summary || '暂无摘要'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartChapters;
