import React from 'react';
import { Calendar, Clock, Users } from 'lucide-react';
import { MeetingData } from '../types/meeting';

interface HeaderProps {
  data: MeetingData;
}

const Header: React.FC<HeaderProps> = ({ data }) => {
  // Format upload time to YYYY-MM-DD
  const parseDate = (value: string) => {
    if (!value) return null;
    const trimmed = value.trim();
    const direct = new Date(trimmed);
    if (!Number.isNaN(direct.getTime())) return direct;
    const zhMatch = trimmed.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (zhMatch) {
      const year = Number(zhMatch[1]);
      const month = Number(zhMatch[2]);
      const day = Number(zhMatch[3]);
      const zhDate = new Date(year, month - 1, day);
      if (!Number.isNaN(zhDate.getTime())) return zhDate;
    }
    return null;
  };

  const formatDate = (primary: string, fallback: string) => {
    const date = parseDate(primary) ?? parseDate(fallback);
    if (!date) return '未知日期';
    return date
      .toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      .replace(/\//g, '-');
  };

  // Check if duration already has units, if not add "分钟"
  const formatDuration = (duration: string) => {
    if (!duration) return '';
    if (duration.includes('分钟') || duration.includes('min')) {
      return duration;
    }
    // If it's just a number, assume minutes
    if (!isNaN(Number(duration))) {
        return `${duration}分钟`;
    }
    return duration;
  };

  return (
    <div className="mb-8 space-y-4">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{data.title}</h1>
      <div className="flex flex-wrap gap-6 text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <span>{formatDate(data.date, data.uploadTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span>{formatDuration(data.duration)}</span>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Users className="w-5 h-5 text-gray-500 mt-0.5" />
        <div className="flex flex-wrap gap-2">
          {data.participants.map((p, index) => (
            <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
              {p.name}{p.role ? ` · ${p.role}` : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Header;
