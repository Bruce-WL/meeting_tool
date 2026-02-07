import React from 'react';
import { Calendar, Clock, Users } from 'lucide-react';
import { MeetingData } from '../types/meeting';

interface HeaderProps {
  data: MeetingData;
}

const Header: React.FC<HeaderProps> = ({ data }) => {
  return (
    <div className="mb-8 space-y-4">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{data.title}</h1>
      <div className="flex flex-wrap gap-6 text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <span>{data.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span>{data.duration}</span>
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
