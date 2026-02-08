import React from 'react';
import { CheckSquare, Square, User } from 'lucide-react';
import { TodoItem } from '../types/meeting';
import { cn } from '../lib/utils';

interface TodoListProps {
  todos: TodoItem[];
}

const TodoList: React.FC<TodoListProps> = ({ todos }) => {
  // Ensure todos is always an array
  const safeTodos = Array.isArray(todos) ? todos : [];
  
  if (safeTodos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
          待办事项
        </h2>
        <p className="text-gray-500 text-center py-8">暂无待办事项</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
        待办事项
      </h2>
      <div className="space-y-4">
        {safeTodos.map((todo) => (
          <div 
            key={todo.id} 
            className="flex items-start gap-3 group"
          >
            <div className="mt-1 text-gray-400 group-hover:text-blue-500 transition-colors cursor-pointer">
              {todo.completed ? (
                <CheckSquare className="w-5 h-5 text-blue-500" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </div>
            <div className="flex-grow">
              <p className={cn(
                "text-base text-gray-800 leading-snug",
                todo.completed && "line-through text-gray-400"
              )}>
                {todo.content || '未指定内容'}
              </p>
              {todo.assignee && (
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  <span>{todo.assignee}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodoList;
