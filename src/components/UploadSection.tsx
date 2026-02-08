import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../api';

const UploadSection: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { taskId } = await uploadFile(file);
      navigate(`/result/${taskId}`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-10">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".mp3,.wav,.m4a"
      />
      <div 
        onClick={handleClick}
        className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="p-4 bg-gray-50 rounded-full group-hover:bg-white transition-colors">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
            )}
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isUploading ? '正在上传...' : '点击或拖拽上传录音文件'}
            </p>
            <p className="text-sm text-gray-500 mt-1">支持 MP3, WAV, M4A 格式 (最大 50MB)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadSection;
