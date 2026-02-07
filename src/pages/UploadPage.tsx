import React from 'react';
import { useNavigate } from 'react-router-dom';
import UploadSection from '../components/UploadSection';
import SummarySection from '../components/SummarySection';
import { homeSummaryGroups, homeSummaryOverview } from '../data/homeData';
import { ArrowRight } from 'lucide-react';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">智能会议纪要</h1>
          <p className="text-xl text-gray-600">上传录音后，自动生成结构化纪要</p>
        </div>
        
        <UploadSection />

        <SummarySection overview={homeSummaryOverview} groups={homeSummaryGroups} showHeader={false} boxed={false} />

        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigate('/result')}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors font-medium"
          >
            查看演示纪要
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
