import React from 'react';
import { Lightbulb, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import SummarySection from '../components/SummarySection';
import TodoList from '../components/TodoList';
import SmartChapters from '../components/SmartChapters';
import InfoBlock from '../components/InfoBlock';
import { meetingData } from '../data/meetingData';

const MeetingMinutesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Header data={meetingData} />
        
        <SummarySection cards={meetingData.summaryCards} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            <SmartChapters chapters={meetingData.smartChapters} />
            <TodoList todos={meetingData.todoList} />
          </div>
          
          {/* Sidebar Column */}
          <div className="space-y-8">
            <InfoBlock 
              title="关键决策" 
              items={meetingData.keyDecisions} 
              icon={Lightbulb} 
              color="orange" 
            />
            <InfoBlock 
              title="金句时刻" 
              items={meetingData.goldenMoments} 
              icon={Sparkles} 
              color="yellow" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingMinutesPage;
