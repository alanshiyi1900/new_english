import React, { useState } from 'react';
import { Button } from './Button';
import { Sparkles, ArrowRight, BookOpen, MessageCircle, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (name: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    // Simulate network delay for realism
    setTimeout(() => {
      onLogin(name);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-orange-200/40 rounded-full blur-3xl" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 z-10 border border-slate-100 animate-in fade-in zoom-in duration-500">
        
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200 rotate-3 transform hover:rotate-6 transition-transform">
            <Sparkles size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">FluentAI</h1>
          <p className="text-slate-500">Your personal AI English Tutor.</p>
        </div>

        {/* Feature Pills */}
        <div className="flex justify-center gap-3 mb-8">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600">
             <MessageCircle size={14} className="text-indigo-500" /> Real Talk
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600">
             <BookOpen size={14} className="text-orange-500" /> Vocabulary
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
              What should we call you?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400"
              autoFocus
            />
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              disabled={!name.trim() || isLoading}
              className="w-full py-4 text-lg rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              {isLoading ? 'Signing in...' : 'Start Learning'}
              {!isLoading && <ArrowRight size={20} />}
            </Button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
           <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
             <ShieldCheck size={12} />
             Secure & Private. Progress saved locally.
           </p>
        </div>
      </div>
    </div>
  );
};