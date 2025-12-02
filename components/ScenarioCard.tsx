import React from 'react';
import { Scenario } from '../types';
import { ArrowRight, User, Bot } from 'lucide-react';

interface ScenarioCardProps {
  scenario: Scenario;
  onClick: () => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onClick }) => {
  const difficultyColor = {
    'Beginner': 'bg-emerald-100 text-emerald-700',
    'Intermediate': 'bg-amber-100 text-amber-700',
    'Advanced': 'bg-rose-100 text-rose-700',
  };

  return (
    <div 
      onClick={onClick}
      className="group relative bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden"
    >
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex justify-between items-start mb-3">
        <div className="text-3xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner">
          {scenario.emoji}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${difficultyColor[scenario.difficulty]}`}>
          {scenario.difficulty}
        </span>
      </div>
      
      <h3 className="text-base font-bold text-slate-800 mb-1 leading-snug group-hover:text-indigo-600 transition-colors">
        {scenario.title}
      </h3>
      <p className="text-xs text-slate-500 mb-4 line-clamp-3 leading-relaxed flex-grow">
        {scenario.description}
      </p>

      <div className="pt-3 border-t border-slate-50 mt-auto">
        <div className="flex items-center justify-between text-xs text-slate-400">
           <div className="flex items-center gap-1.5">
              <Bot size={14} className="text-indigo-400" />
              <span className="truncate max-w-[80px]">{scenario.aiRole}</span>
           </div>
           <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
             <ArrowRight size={12} />
           </div>
        </div>
      </div>
    </div>
  );
};