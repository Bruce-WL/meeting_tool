import React from 'react';
import { UploadCloud } from 'lucide-react';

const UploadSection: React.FC = () => {
  return (
    <div className="mb-10">
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="p-4 bg-gray-50 rounded-full group-hover:bg-white transition-colors">
            <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">点击或拖拽上传录音文件</p>
            <p className="text-sm text-gray-500 mt-1">支持 MP3, WAV, M4A 格式 (最大 500MB)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadSection;
