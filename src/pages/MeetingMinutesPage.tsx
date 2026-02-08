import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import Header from '../components/Header';
import SummarySection from '../components/SummarySection';
import TodoList from '../components/TodoList';
import SmartChapters from '../components/SmartChapters';
import InfoBlock from '../components/InfoBlock';
import { meetingData as staticMeetingData } from '../data/meetingData';
import { getTaskStatus, getTaskLogs, TaskStatus, LogEntry, type MeetingResult } from '../api';
import type { MeetingData } from '../types/meeting';

const POLLING_INTERVAL = 3000;

/** 标题下方固定免责声明，不随接口/静态数据变化 */
const AI_DISCLAIMER =
  '本纪要由AI助手根据提供的会议笔记自动生成，可能存在理解偏差或遗漏。请与会者核对关键信息与待办事项，并反馈更正。';

const MeetingMinutesPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<MeetingResult | null>(taskId ? null : staticMeetingData);
  const [status, setStatus] = useState<TaskStatus['status']>('pending');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [taskSnapshot, setTaskSnapshot] = useState<TaskStatus | null>(null);
  const [fileLogs, setFileLogs] = useState<LogEntry[]>([]);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!taskId) return;

    const poll = async () => {
      try {
        const [task, logs] = await Promise.all([
          getTaskStatus(taskId),
          getTaskLogs(taskId).catch(() => []) // Ignore log fetch errors to avoid breaking status check
        ]);
        
        setTaskSnapshot(task);
        setFileLogs(logs);
        setStatus(task.status);
        setProgress(task.progress || 0);
        setStage(task.stage || '');

        if (task.status === 'completed' && task.result) {
          const resultData = 'data' in task.result ? task.result.data : task.result;
          setData(resultData || null);
        } else if (task.status === 'failed') {
          setError(task.error || 'Task failed');
        }
      } catch (err) {
        console.error('Polling failed', err);
      }
    };

    poll();

    pollTimerRef.current = setInterval(poll, POLLING_INTERVAL);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [taskId]);

  useEffect(() => {
    if ((status === 'completed' || status === 'failed') && pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }
  }, [status]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [fileLogs.length]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">处理失败</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (taskId && (!data || status !== 'completed')) {
    const logs = taskSnapshot?.logs || [];
    const latestLogs = logs.slice(-6);
    const metrics = taskSnapshot?.metrics;
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl space-y-6 text-center">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">
            正在生成会议纪要...
          </h2>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 font-medium">
              <span>{stage || '准备中...'}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 text-left h-[500px]">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex-1 flex flex-col min-h-0">
              <div className="text-sm font-semibold text-gray-900 mb-2 flex-none">处理进度</div>
              <div className="flex-1 overflow-auto space-y-1 text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded border border-gray-100">
                {(() => {
                  const startedAt = metrics?.startedAt || logs[0]?.at || Date.now();
                  return (
                    <>
                      {logs.map((log, index) => {
                        const elapsedSeconds = Math.max(0, Math.round((log.at - startedAt) / 1000));
                        return (
                          <div key={`${log.at}-${index}`} className="whitespace-nowrap flex items-baseline">
                            <span className="text-gray-400 inline-block w-[40px] flex-none">[{elapsedSeconds}s]</span>
                            <span className={`font-medium flex-none ${log.stage.includes('Error') ? 'text-red-600' : 'text-indigo-600'}`}>
                              {log.stage}
                            </span>
                            {log.progress !== undefined && <span className="ml-2 text-gray-500 flex-none">{log.progress}%</span>}
                            {log.message && <span className="ml-2 text-gray-400 truncate">- {log.message}</span>}
                          </div>
                        );
                      })}
                      {logs.length === 0 && <div className="text-gray-400 italic">等待开始...</div>}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex-1 flex flex-col min-h-0">
              <div className="text-sm font-semibold text-gray-900 mb-2">系统日志</div>
              <div className="flex-1 overflow-auto space-y-1 text-xs font-mono bg-gray-900 text-gray-100 p-3 rounded border border-gray-800">
                {fileLogs.length === 0 ? (
                  <div className="text-gray-500 italic">暂无日志...</div>
                ) : (
                  fileLogs.map((log, i) => (
                    <div key={i} className="break-all whitespace-pre-wrap border-b border-gray-800 pb-1 mb-1 last:border-0">
                      {log.timestamp && (
                        <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}] </span>
                      )}
                      {log.stage && <span className="text-blue-400 font-bold">[{log.stage}] </span>}
                      <span className={log.level === 'error' ? 'text-red-400' : 'text-gray-300'}>
                        {log.message || JSON.stringify(log)}
                      </span>
                      {log.data && (
                        <div className="pl-4 text-gray-500 text-[10px] mt-0.5 opacity-70">
                          {JSON.stringify(log.data)}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const normalizedData: MeetingData = {
    id: data.id || '',
    title: data.title || '会议纪要',
    meetingTopic: data.meetingTopic || '',
    uploadTime: data.uploadTime || '',
    date: data.date || '',
    duration: data.duration || '',
    participants: Array.isArray(data.participants) ? data.participants : [],
    summaryCards: Array.isArray(data.summaryCards) ? data.summaryCards : [],
    summaryOverview: data.summaryOverview || '',
    summaryGroups: Array.isArray(data.summaryGroups) ? data.summaryGroups.map(g => ({
      ...g,
      id: g.id || `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: g.title || '未命名分组',
      modules: Array.isArray(g.modules) ? g.modules.map(m => ({
        ...m,
        id: m.id || `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: m.title || '未命名模块',
        icon: m.icon || 'Target',
        type: m.type || '通用',
        color: m.color || 'indigo',
        points: Array.isArray(m.points) ? m.points : []
      })) : []
    })) : [],
    summaryHighlights: Array.isArray(data.summaryHighlights) ? data.summaryHighlights : [],
    // 修复 summaryDetails: 使用 points 作为 description
    summaryDetails: Array.isArray(data.summaryDetails) ? data.summaryDetails.map(d => ({
      key: d.key || d.points?.split('，')[0] || '未指定',
      description: d.points || d.description || ''
    })) : [],
    // 修复 todoList: 使用 points 作为 content
    todoList: Array.isArray(data.todoList) ? data.todoList.map(t => ({
      id: t.id || `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: t.points || t.content || '未指定内容',
      completed: t.completed || false,
      assignee: t.assignee
    })) : [],
    // 修复 smartChapters: 使用 points 作为 summary
    smartChapters: Array.isArray(data.smartChapters) ? data.smartChapters.map(c => ({
      id: c.id || `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: c.timestamp || '00:00',
      title: c.title || '未命名章节',
      summary: c.points || c.summary || '暂无摘要'
    })) : [],
    keyDecisions: Array.isArray(data.keyDecisions) ? data.keyDecisions : [],
    goldenMoments: Array.isArray(data.goldenMoments) ? data.goldenMoments : [],
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <Header data={normalizedData} />

        <blockquote className="border-l-4 border-gray-300 pl-4 text-sm text-gray-600">
          {AI_DISCLAIMER}
        </blockquote>

        <SummarySection
          overview={normalizedData.summaryOverview || ''}
          groups={normalizedData.summaryGroups || []}
          details={normalizedData.summaryDetails}
        />

        {normalizedData.todoList.length > 0 && (
           <TodoList todos={normalizedData.todoList} />
        )}

        {normalizedData.smartChapters.length > 0 && (
           <SmartChapters chapters={normalizedData.smartChapters} />
        )}

        {normalizedData.keyDecisions.length > 0 && (
           <InfoBlock title="关键决策" items={normalizedData.keyDecisions} color="orange" />
        )}
        
        {normalizedData.goldenMoments.length > 0 && (
           <InfoBlock title="金句时刻" items={normalizedData.goldenMoments} color="yellow" />
        )}
      </div>
    </div>
  );
};

export default MeetingMinutesPage;
