import React from 'react';
import { Calendar, Clock, Users } from 'lucide-react';
import { MeetingData } from '../types/meeting';

interface HeaderProps {
  data: MeetingData;
}

const Header: React.FC<HeaderProps> = ({ data }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{data.title}</h1>
      <div className="flex flex-wrap gap-6 text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <span>{data.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span>{data.duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <div className="flex gap-2">
            {data.participants.map((p, index) => (
              <span key={index} className="bg-gray-100 px-2 py-0.5 rounded text-sm">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
