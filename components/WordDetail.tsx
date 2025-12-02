import React from 'react';
import { VocabularyWord } from '../types';
import { ArrowLeft, Volume2, Plus, Loader2 } from 'lucide-react';
import { speakText } from '../services/speechService';
import { Button } from './Button';

interface WordDetailProps {
  word: VocabularyWord;
  onBack: () => void;
  onMastered: (id: string) => void;
  onSynonymClick: (synonym: string) => void;
}

export const WordDetail: React.FC<WordDetailProps> = ({ word, onBack, onMastered, onSynonymClick }) => {
  return (
    <div className="h-full bg-white flex flex-col font-sans text-slate-900 animate-in slide-in-from-right duration-200">
      {/* Navbar */}
      <div className="px-4 py-3 flex items-center sticky top-0 bg-white z-20 border-b border-slate-50">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-safe">
        
        {/* Word Header Section */}
        <div className="mt-4 mb-8 border-b border-slate-100 pb-6">
           <div className="flex items-baseline gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">{word.word}</h1>
           </div>
           
           <div className="mt-3 flex items-center gap-3">
               {word.phonetic ? (
                 <span className="text-slate-500 text-lg font-sans tracking-wide font-medium">{word.phonetic}</span>
               ) : (
                 <span className="text-slate-300 text-sm flex items-center gap-1">
                   <Loader2 size={12} className="animate-spin" /> Analyzing...
                 </span>
               )}
               <button 
                 onClick={() => speakText(word.word)}
                 className="text-indigo-600 hover:text-indigo-700 active:scale-90 transition-transform p-1"
               >
                  <Volume2 size={22} />
               </button>
           </div>

           <div className="mt-5 flex items-start text-lg leading-relaxed">
               {word.partOfSpeech ? (
                 <span className="font-bold text-slate-800 mr-3 shrink-0 italic">{word.partOfSpeech}</span>
               ) : (
                 <span className="font-bold text-slate-300 mr-3 shrink-0 italic">...</span>
               )}
               
               <span className="text-slate-800 font-medium">
                 {word.chineseDefinition || word.definition}
               </span>
           </div>
        </div>

        {/* Example Sentences Section ("例句") */}
        <div className="mb-8">
           <h3 className="text-base font-bold text-slate-900 mb-4">例句</h3>
           
           <div className="space-y-6">
              {/* Dictionary Example */}
              <div>
                 <div className="flex items-center gap-2 mb-1">
                   <span className="bg-indigo-50 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Dict</span>
                   <p className="text-lg text-slate-800 leading-snug font-medium">
                      {word.exampleSentence || "Loading example..."}
                      {word.exampleSentence && (
                        <button 
                          onClick={() => speakText(word.exampleSentence!)}
                          className="inline-block ml-2 text-indigo-500 align-middle active:scale-90 transition-transform"
                        >
                          <Volume2 size={18} />
                        </button>
                      )}
                   </p>
                 </div>
                 <p className="text-slate-500 text-sm pl-9">
                    {word.exampleTranslation}
                 </p>
              </div>

              {/* User Context Example (if different) */}
              {word.context && word.context !== word.exampleSentence && (
                <div className="pt-4 border-t border-slate-50 dashed">
                   <div className="flex items-center gap-2 mb-1">
                     <span className="bg-amber-50 text-amber-600 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Chat</span>
                     <p className="text-lg text-slate-800 leading-snug font-medium">
                        {word.context}
                        <button 
                          onClick={() => speakText(word.context)}
                          className="inline-block ml-2 text-amber-500 align-middle active:scale-90 transition-transform"
                        >
                          <Volume2 size={18} />
                        </button>
                     </p>
                   </div>
                   <p className="text-slate-400 text-xs pl-9 italic">
                      From your conversation
                   </p>
                </div>
              )}
           </div>
        </div>

        {/* Synonyms / Lookalikes ("形近词") */}
        {(word.synonyms && word.synonyms.length > 0) && (
           <div className="mb-8">
              <h3 className="text-base font-bold text-slate-900 mb-3">形近词</h3>
              <div className="flex flex-wrap gap-2">
                  {word.synonyms.map((syn, i) => (
                    <button 
                      key={i} 
                      onClick={() => onSynonymClick(syn)}
                      className="bg-slate-50 hover:bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl text-sm font-semibold transition-all border border-slate-100 hover:border-indigo-100 flex items-center gap-1 active:scale-95"
                    >
                      {syn}
                      <Plus size={12} className="opacity-50" />
                    </button>
                  ))}
              </div>
           </div>
        )}

        {/* Roots ("词根") */}
        {word.roots && (
           <div className="mb-8">
              <h3 className="text-base font-bold text-slate-900 mb-3">词根</h3>
              <div className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {word.roots}
              </div>
           </div>
        )}

        {/* English Definition ("英文释义") */}
        <div className="mb-24">
           <h3 className="text-base font-bold text-slate-900 mb-3">英文释义</h3>
           <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {word.definition}
              </p>
           </div>
        </div>

      </div>

      {/* Footer Action */}
      <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0 z-20 pb-8">
        <Button 
          onClick={() => {
            onMastered(word.id);
            onBack();
          }}
          className="w-full py-3.5 text-lg rounded-full shadow-lg shadow-indigo-200 hover:shadow-xl bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-[0.98]"
        >
          斩 / Mastered
        </Button>
      </div>
    </div>
  );
};