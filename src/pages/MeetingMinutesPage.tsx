import React from 'react';
import Header from '../components/Header';
import SummarySection from '../components/SummarySection';
import TodoList from '../components/TodoList';
import SmartChapters from '../components/SmartChapters';
import InfoBlock from '../components/InfoBlock';
import { meetingData } from '../data/meetingData';

const MeetingMinutesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <Header data={meetingData} />

        <blockquote className="border-l-4 border-gray-300 pl-4 text-sm text-gray-600">
          {meetingData.aiDisclaimer}
        </blockquote>

        <SummarySection
          overview={meetingData.summaryOverview || ''}
          groups={meetingData.summaryGroups || []}
          details={meetingData.summaryDetails}
        />

        <TodoList todos={meetingData.todoList} />

        <SmartChapters chapters={meetingData.smartChapters} />

        <InfoBlock title="关键决策" items={meetingData.keyDecisions} color="orange" />
        <InfoBlock title="金句时刻" items={meetingData.goldenMoments} color="yellow" />
      </div>
    </div>
  );
};

export default MeetingMinutesPage;
