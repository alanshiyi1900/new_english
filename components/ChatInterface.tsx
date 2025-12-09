import React, { useState, useEffect, useRef } from 'react';
import { Scenario, ChatMessage, VocabularyWord, ChatMode } from '../types';
import { generateTeacherResponse, startGuidedSession } from '../services/geminiService';
import { startListening, speakText } from '../services/speechService';
import { Button } from './Button';
import { Mic, Send, Volume2, ArrowLeft, BookmarkPlus, Sparkles, AlertCircle, Loader2, Flag, CheckCircle2 } from 'lucide-react';

interface ChatInterfaceProps {
  scenario: Scenario;
  mode: ChatMode;
  initialMessages?: ChatMessage[];
  onBack: () => void;
  onSaveWord: (word: VocabularyWord) => void;
  onMessagesChange: (messages: ChatMessage[]) => void;
  onReportProgress?: (seconds: number) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  scenario, 
  mode,
  initialMessages = [], 
  onBack, 
  onSaveWord,
  onMessagesChange,
  onReportProgress
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      if (messages.length === 0) {
        setIsLoading(true);
        try {
          if (mode === 'guided') {
            // Generate dynamic start for guided mode
            const startMsg = await startGuidedSession(scenario);
            setMessages([startMsg]);
            speakText(startMsg.text);
          } else {
            // Standard start for free talk
            const defaultStart: ChatMessage = {
              id: 'init',
              role: 'ai',
              text: scenario.initialMessage,
              translation: 'Tap to translate', 
            };
            setMessages([defaultStart]);
            speakText(scenario.initialMessage);
          }
        } catch (e) {
          console.error("Failed to init session", e);
        } finally {
          setIsLoading(false);
        }
      } else if (isInitialMount.current) {
        // Resuming existing session
        // Don't auto-speak on resume to avoid annoyance
      }
    };
    
    initSession();
    isInitialMount.current = false;
  }, [scenario, mode, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    onMessagesChange(messages);
  }, [messages, onMessagesChange]);

  useEffect(() => {
    if (!onReportProgress) return;
    const interval = setInterval(() => {
      onReportProgress(10);
    }, 10000);
    return () => clearInterval(interval);
  }, [onReportProgress]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const aiResponseData = await generateTeacherResponse(messages, text, scenario, mode);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: aiResponseData.roleplayResponse,
        correction: aiResponseData.correction,
        explanation: aiResponseData.explanation,
        translation: aiResponseData.translation,
        referenceTranslation: aiResponseData.referenceTranslation,
        suggestedVocab: aiResponseData.suggestedVocab,
        guidedTask: aiResponseData.guidedTask // Will be present if mode is guided
      };

      setMessages(prev => [...prev, aiMsg]);
      speakText(aiMsg.text);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: 'error',
        role: 'ai',
        text: "I'm having trouble connecting to the server. Please try again."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      startListening(
        (text) => {
          setInputText(text);
          setIsRecording(false);
        },
        () => setIsRecording(false),
        (errorMessage) => {
          console.error(errorMessage);
          setIsRecording(false);
          // Simple alert for now, could be a toast in future
          alert(errorMessage);
        }
      );
    }
  };

  const handleSaveVocab = (wordStr: string, def: string) => {
    const newWord: VocabularyWord = {
      id: Date.now().toString(),
      word: wordStr,
      definition: def,
      context: messages[messages.length - 1]?.text || 'Chat context',
      addedAt: Date.now()
    };
    onSaveWord(newWord);
  };

  // Get current guided task (from the last AI message)
  const currentTask = messages.length > 0 
    ? [...messages].reverse().find(m => m.role === 'ai')?.guidedTask 
    : null;

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="text-xl">{scenario.emoji}</span> {scenario.title}
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">With: <span className="font-medium text-indigo-600">{scenario.aiRole}</span></span>
              {mode === 'guided' && (
                <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase text-[10px]">
                  Challenge Mode
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide pb-32">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              
              {/* Correction Bubble (Attached to User Message) */}
              {isUser && messages[idx + 1]?.correction && (
                 <div className="mb-2 mr-2 max-w-[85%] bg-orange-50 border border-orange-100 rounded-xl p-3 text-sm animate-fade-in relative shadow-sm">
                    <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-orange-50 border-b border-r border-orange-100 rotate-45"></div>
                    <div className="flex items-start gap-2 text-orange-800 font-medium mb-2">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>Feedback:</span>
                    </div>
                    
                    <div className="text-slate-700 pl-6 space-y-2">
                       {/* Specific Correction */}
                       <div>
                         <div className="text-xs text-slate-400 mb-0.5">Your Input:</div>
                         <div className="line-through text-slate-400 opacity-75 decoration-orange-300">{msg.text}</div>
                         <div className="text-green-600 font-semibold mt-1 flex items-start gap-1">
                            <span className="shrink-0">➜</span>
                            {messages[idx+1].correction}
                         </div>
                       </div>
                       
                       {/* Reference Translation (Ideal Answer) */}
                       {messages[idx+1].referenceTranslation && (
                          <div className="bg-orange-100/50 p-2 rounded-lg border border-orange-100 mt-2">
                            <div className="text-[10px] font-bold text-orange-700 uppercase mb-0.5 tracking-wide">
                               Standard Answer
                            </div>
                            <div className="text-slate-800 font-medium">
                              {messages[idx+1].referenceTranslation}
                            </div>
                          </div>
                       )}

                       {/* Explanation */}
                       {messages[idx+1].explanation && (
                         <div className="text-slate-500 text-xs italic border-l-2 border-orange-200 pl-2 mt-1">
                           {messages[idx+1].explanation}
                         </div>
                       )}
                    </div>
                 </div>
              )}

              {/* Message Bubble */}
              <div className={`
                max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-4 shadow-sm relative group
                ${isUser 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }
              `}>
                <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                
                {/* AI Features: Translation & Vocab */}
                {!isUser && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    {msg.translation && (
                      <p className="text-slate-500 text-sm italic">{msg.translation}</p>
                    )}
                    
                    {msg.suggestedVocab && msg.suggestedVocab.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.suggestedVocab.map((v, vIdx) => (
                           <button 
                             key={vIdx}
                             onClick={() => handleSaveVocab(v.word, v.definition)}
                             className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-xs transition-colors border border-indigo-100"
                           >
                             <BookmarkPlus size={12} />
                             <span className="font-semibold">{v.word}</span>
                           </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Actions */}
                <button 
                  onClick={() => speakText(msg.text)}
                  className={`
                    absolute top-2 right-2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                    ${isUser ? 'text-indigo-200 hover:bg-indigo-500' : 'text-slate-400 hover:bg-slate-100'}
                  `}
                >
                  <Volume2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
        
        {isLoading && (
           <div className="flex items-center gap-2 text-slate-400 text-sm ml-4 animate-pulse">
             <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
               <Sparkles size={16} />
             </div>
             <span>Thinking...</span>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-slate-200 shadow-lg z-20 relative">
        {/* Guided Task Banner */}
        {mode === 'guided' && currentTask && !isLoading && (
          <div className="absolute -top-16 left-4 right-4 bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-md animate-in slide-in-from-bottom-2 flex items-start gap-3">
             <div className="bg-amber-100 p-1.5 rounded-full text-amber-600 shrink-0 mt-0.5">
               <Flag size={16} />
             </div>
             <div>
               <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Your Mission</p>
               <p className="text-sm font-medium text-slate-800">{currentTask}</p>
             </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <div className="relative flex-1">
             <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(inputText);
                  }
                }}
                placeholder={mode === 'guided' ? "Translate the mission to English..." : "Type your message..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none h-[52px] max-h-32 transition-all"
                rows={1}
             />
             <button
               onClick={toggleRecording}
               className={`absolute right-2 bottom-1.5 p-2 rounded-xl transition-all duration-300 ${
                 isRecording 
                   ? 'bg-red-500 text-white shadow-red-200 shadow-md animate-pulse' 
                   : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
               }`}
             >
               {isRecording ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
             </button>
          </div>
          
          <Button 
            onClick={() => handleSend(inputText)} 
            disabled={!inputText.trim() || isLoading}
            className="h-[52px] w-[52px] !p-0 rounded-2xl"
          >
            <Send size={20} className={isLoading ? 'opacity-0' : 'ml-0.5'} />
            {isLoading && <Loader2 size={20} className="absolute animate-spin" />}
          </Button>
        </div>
      </div>
    </div>
  );
};