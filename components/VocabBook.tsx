import React, { useState } from 'react';
import { VocabularyWord } from '../types';
import { Volume2, Eye, EyeOff, Book, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import { speakText } from '../services/speechService';

interface VocabBookProps {
  words: VocabularyWord[];
  onDelete: (id: string) => void;
  onSelectWord: (word: VocabularyWord) => void;
}

export const VocabBook: React.FC<VocabBookProps> = ({ words, onDelete, onSelectWord }) => {
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newRevealed = new Set(revealedIds);
    if (newRevealed.has(id)) {
      newRevealed.delete(id);
    } else {
      newRevealed.add(id);
    }
    setRevealedIds(newRevealed);
  };

  return (
    <div className="bg-slate-100 h-full flex flex-col font-sans">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Book className="text-indigo-600" size={24} />
            Word Book
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {words.length} {words.length === 1 ? 'word' : 'words'} to master
          </p>
        </div>

        <button
          onClick={() => {
            setIsReviewMode(!isReviewMode);
            setRevealedIds(new Set()); 
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
            isReviewMode 
              ? 'bg-indigo-600 text-white border-indigo-600' 
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
          }`}
        >
          {isReviewMode ? <EyeOff size={14} /> : <Eye size={14} />}
          {isReviewMode ? 'Recite' : 'View'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
        {words.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 -mt-10">
            <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
              <Sparkles size={40} className="text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-600">All caught up!</p>
            <p className="text-sm mt-2 max-w-[200px] text-center">Start a new conversation to collect more vocabulary.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-xl mx-auto">
            {words.map((word) => {
              const isHidden = isReviewMode && !revealedIds.has(word.id);

              return (
                <div 
                  key={word.id} 
                  onClick={() => onSelectWord(word)}
                  className="bg-white rounded-xl shadow-sm border border-slate-100 relative group transition-all active:scale-[0.98] hover:shadow-md cursor-pointer flex items-stretch overflow-hidden"
                >
                   {/* Left Accent */}
                   <div className="w-1.5 bg-indigo-500"></div>

                   <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div className="flex justify-between items-start">
                         <div>
                            <h3 className="text-2xl font-serif font-bold text-slate-900 leading-none">
                              {word.word}
                            </h3>
                            <div className="flex items-center gap-2 text-slate-400 text-xs mt-1">
                               {word.phonetic ? (
                                 <span className="font-sans">{word.phonetic}</span>
                               ) : (
                                 <span className="flex items-center gap-1 opacity-50"><Loader2 size={10} className="animate-spin" /> ...</span>
                               )}
                               <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    speakText(word.word);
                                  }}
                                  className="text-indigo-400 hover:text-indigo-600 p-1 -m-1"
                               >
                                 <Volume2 size={14} />
                               </button>
                            </div>
                         </div>
                      </div>

                      <div className="relative">
                         {/* Definition Preview */}
                         <div className={`transition-all duration-300 ${isHidden ? 'blur-md opacity-30 select-none' : 'blur-0 opacity-100'}`}>
                            <p className="text-slate-700 font-medium text-sm line-clamp-1">
                               {word.chineseDefinition ? (
                                  <>
                                    <span className="italic text-slate-400 font-serif mr-2 font-bold">{word.partOfSpeech || "n."}</span>
                                    {word.chineseDefinition}
                                  </>
                               ) : word.definition}
                            </p>
                            <p className="text-slate-400 text-xs line-clamp-1 mt-1 font-serif italic">
                               "{word.exampleSentence || word.context}"
                            </p>
                         </div>

                         {/* Overlay for Review Mode */}
                         {isHidden && (
                           <div className="absolute inset-0 flex items-center">
                             <button 
                               onClick={(e) => toggleReveal(word.id, e)}
                               className="text-indigo-600 text-xs font-bold bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100"
                             >
                               Tap to Reveal
                             </button>
                           </div>
                         )}
                      </div>
                   </div>

                   {/* Right Icon */}
                   <div className="flex items-center justify-center pr-4 pl-2 text-slate-300">
                      <ChevronRight size={20} />
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};