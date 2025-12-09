import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Book, User, Plus, X, Sparkles, Trophy, Flame, Loader2, Clock, Calendar, ChevronRight, Edit2, Settings, BarChart3, LogOut, Medal, Target, Languages, Mic } from 'lucide-react';
import { Scenario, VocabularyWord, ConversationSession, ChatMessage, ChatMode } from './types';
import { PREDEFINED_SCENARIOS, INITIAL_VOCAB } from './constants';
import { ScenarioCard } from './components/ScenarioCard';
import { ChatInterface } from './components/ChatInterface';
import { VocabBook } from './components/VocabBook';
import { WordDetail } from './components/WordDetail';
import { Button } from './components/Button';
import { AuthScreen } from './components/AuthScreen';
import { generateScenarioIdeas, lookupVocabulary } from './services/geminiService';

type Tab = 'practice' | 'history' | 'vocab' | 'profile';
type ProfileView = 'main' | 'achievements' | 'settings';

interface UserProfile {
  name: string;
  level: string;
  avatar: string;
}

const ScenarioCarousel = ({ scenarios, onSelect }: { scenarios: Scenario[], onSelect: (s: Scenario) => void }) => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  
  const carouselItems = scenarios.slice(0, 5);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % carouselItems.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [carouselItems.length, isPaused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; 

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        setIndex((prev) => (prev + 1) % carouselItems.length);
      } else {
        setIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
      }
    }
    setTimeout(() => setIsPaused(false), 2000);
  };

  return (
    <div 
       className="relative w-full h-48 mb-6 rounded-3xl overflow-hidden shadow-lg shadow-indigo-200/50 group bg-slate-100 touch-pan-y"
       onTouchStart={handleTouchStart}
       onTouchMove={handleTouchMove}
       onTouchEnd={handleTouchEnd}
    >
       <div 
         className="flex h-full transition-transform duration-500 ease-out"
         style={{ transform: `translateX(-${index * 100}%)` }}
       >
         {carouselItems.map((item, i) => (
           <div 
             key={item.id} 
             onClick={() => onSelect(item)}
             className="min-w-full h-full relative cursor-pointer"
           >
              <div className={`absolute inset-0 bg-gradient-to-br ${
                 i % 3 === 0 ? 'from-indigo-600 to-purple-700' :
                 i % 3 === 1 ? 'from-blue-600 to-cyan-600' :
                 'from-rose-500 to-orange-600'
              }`}></div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10 p-6 h-full flex flex-col justify-center text-white">
                 <div className="flex items-center gap-2 mb-3">
                    <span className="bg-white/20 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/10">
                       Top Pick
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/20`}>
                       {item.difficulty}
                    </span>
                 </div>
                 
                 <div className="flex items-end justify-between">
                    <div className="max-w-[75%]">
                        <h2 className="text-2xl font-bold mb-1 leading-tight">{item.title}</h2>
                        <p className="text-white/80 text-sm line-clamp-2 leading-relaxed">
                        {item.description}
                        </p>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-white/20 backdrop-blur-md w-12 h-12 rounded-2xl border border-white/20 shadow-sm group-hover:scale-110 transition-transform">
                        <span className="text-2xl">{item.emoji}</span>
                    </div>
                 </div>
              </div>
           </div>
         ))}
       </div>

       <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
         {carouselItems.map((_, i) => (
           <div 
             key={i} 
             onClick={(e) => { e.stopPropagation(); setIndex(i); }}
             className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
               i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
             }`} 
           />
         ))}
       </div>
    </div>
  );
};

const App: React.FC = () => {
  // --- Auth & User Identification ---
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem('fluentai-current-user');
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!currentUserId);

  // Helper to generate user-specific storage keys
  const getStorageKey = (uid: string, key: string) => `fluentai-${uid}-${key}`;

  const [activeTab, setActiveTab] = useState<Tab>('practice');
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  
  // --- Data State (Initialized from User-Specific Storage) ---
  const [vocab, setVocab] = useState<VocabularyWord[]>(() => {
    if (!currentUserId) return INITIAL_VOCAB;
    const saved = localStorage.getItem(getStorageKey(currentUserId, 'vocab'));
    return saved ? JSON.parse(saved) : INITIAL_VOCAB;
  });
  
  const [sessions, setSessions] = useState<ConversationSession[]>(() => {
    if (!currentUserId) return [];
    const saved = localStorage.getItem(getStorageKey(currentUserId, 'sessions'));
    return saved ? JSON.parse(saved) : [];
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (!currentUserId) return { name: '', level: 'Intermediate', avatar: '😎' };
    const saved = localStorage.getItem(getStorageKey(currentUserId, 'profile'));
    return saved ? JSON.parse(saved) : { name: '', level: 'Intermediate', avatar: '😎' };
  });

  const [dailyActivity, setDailyActivity] = useState<Record<string, number>>(() => {
    if (!currentUserId) return {};
    const saved = localStorage.getItem(getStorageKey(currentUserId, 'activity'));
    return saved ? JSON.parse(saved) : {};
  });

  // Modal & View State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isModeSelectionOpen, setIsModeSelectionOpen] = useState(false);
  const [selectedScenarioForMode, setSelectedScenarioForMode] = useState<Scenario | null>(null);
  
  const [customTopic, setCustomTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [profileView, setProfileView] = useState<ProfileView>('main');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState('');

  // Infinite Scroll State
  const [visibleScenarios, setVisibleScenarios] = useState<Scenario[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    setVisibleScenarios(PREDEFINED_SCENARIOS.slice(0, ITEMS_PER_PAGE));
  }, []);

  const loadMoreScenarios = () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      const currentLength = visibleScenarios.length;
      const nextBatch = PREDEFINED_SCENARIOS.slice(currentLength, currentLength + ITEMS_PER_PAGE);
      if (nextBatch.length > 0) {
        setVisibleScenarios(prev => [...prev, ...nextBatch]);
      } else {
        setHasMore(false);
      }
      setIsLoadingMore(false);
    }, 800);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMoreScenarios(); },
      { threshold: 0.5 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => { if (observerTarget.current) observer.unobserve(observerTarget.current); };
  }, [visibleScenarios, hasMore, isLoadingMore]);

  // --- Persistence Effects (User Specific) ---
  useEffect(() => { 
    if (currentUserId) localStorage.setItem(getStorageKey(currentUserId, 'vocab'), JSON.stringify(vocab)); 
  }, [vocab, currentUserId]);
  
  useEffect(() => { 
    if (currentUserId) localStorage.setItem(getStorageKey(currentUserId, 'sessions'), JSON.stringify(sessions)); 
  }, [sessions, currentUserId]);
  
  useEffect(() => { 
    if (currentUserId) localStorage.setItem(getStorageKey(currentUserId, 'profile'), JSON.stringify(userProfile)); 
  }, [userProfile, currentUserId]);
  
  useEffect(() => { 
    if (currentUserId) localStorage.setItem(getStorageKey(currentUserId, 'activity'), JSON.stringify(dailyActivity)); 
  }, [dailyActivity, currentUserId]);

  // --- Auth Handlers ---
  const handleLogin = (name: string) => {
    // Generate a simple ID from name
    const userId = name.trim().toLowerCase().replace(/\s+/g, '-');
    
    // Attempt to load existing data for this user
    const savedProfile = localStorage.getItem(getStorageKey(userId, 'profile'));
    const savedVocab = localStorage.getItem(getStorageKey(userId, 'vocab'));
    const savedSessions = localStorage.getItem(getStorageKey(userId, 'sessions'));
    const savedActivity = localStorage.getItem(getStorageKey(userId, 'activity'));

    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    } else {
      // New User Default
      setUserProfile({ name: name, level: 'Intermediate', avatar: '😎' });
    }

    setVocab(savedVocab ? JSON.parse(savedVocab) : INITIAL_VOCAB);
    setSessions(savedSessions ? JSON.parse(savedSessions) : []);
    setDailyActivity(savedActivity ? JSON.parse(savedActivity) : {});

    // Commit Auth
    setCurrentUserId(userId);
    setIsAuthenticated(true);
    localStorage.setItem('fluentai-current-user', userId);
  };

  const handleLogout = () => {
    localStorage.removeItem('fluentai-current-user');
    setCurrentUserId(null);
    setIsAuthenticated(false);
    
    // Reset view states
    setProfileView('main');
    setActiveTab('practice');
    setCurrentSession(null);
    setSelectedWord(null);
    
    // Reset data states to prevent flashing old data if logic fails
    // (though AuthScreen will block view anyway)
    setVocab(INITIAL_VOCAB);
    setSessions([]);
    setUserProfile({ name: '', level: 'Intermediate', avatar: '😎' });
    setDailyActivity({});
  };

  // Session Management
  const handleScenarioClick = (scenario: Scenario) => {
    setSelectedScenarioForMode(scenario);
    setIsModeSelectionOpen(true);
  };

  const handleStartScenario = (scenario: Scenario, mode: ChatMode) => {
    setIsModeSelectionOpen(false);
    setSelectedScenarioForMode(null);

    // If resuming exactly the same session type (same scenario AND same mode)
    const existingSessionIndex = sessions.findIndex(s => s.scenario.id === scenario.id && s.mode === mode);

    if (existingSessionIndex !== -1) {
      const existingSession = sessions[existingSessionIndex];
      const updatedSession = { ...existingSession, lastUpdated: Date.now() };
      
      const otherSessions = sessions.filter((_, i) => i !== existingSessionIndex);
      setSessions([updatedSession, ...otherSessions]);
      setCurrentSession(updatedSession);
    } else {
      const newSession: ConversationSession = {
        id: Date.now().toString(),
        scenario,
        mode,
        messages: [],
        startTime: Date.now(),
        lastUpdated: Date.now()
      };
      setCurrentSession(newSession);
      setSessions(prev => [newSession, ...prev]);
    }
  };

  const handleResumeSession = (session: ConversationSession) => {
    const otherSessions = sessions.filter(s => s.id !== session.id);
    const updatedSession = { ...session, lastUpdated: Date.now() };
    setSessions([updatedSession, ...otherSessions]);
    setCurrentSession(updatedSession);
  };

  const handleUpdateCurrentSession = (messages: ChatMessage[]) => {
    if (!currentSession) return;
    const updatedSession = { ...currentSession, messages, lastUpdated: Date.now() };
    setCurrentSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const handleReportProgress = (seconds: number) => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    setDailyActivity(prev => {
      const current = prev[today] || 0;
      return { ...prev, [today]: current + seconds };
    });
  };

  const handleSaveWord = async (word: VocabularyWord) => {
    // Check duplication
    if (vocab.some(v => v.word.toLowerCase() === word.word.toLowerCase())) return;
    
    // 1. Optimistic Add
    setVocab(prev => [word, ...prev]);

    // 2. Fetch Rich Data in Background
    try {
      const richData = await lookupVocabulary(word.word, word.context);
      setVocab(prev => prev.map(w => 
        w.id === word.id ? { ...w, ...richData } : w
      ));
    } catch (e) {
      console.error("Failed to enrich vocabulary", e);
    }
  };
  
  const handleSynonymClick = (synonym: string) => {
    const existing = vocab.find(v => v.word.toLowerCase() === synonym.toLowerCase());
    
    if (existing) {
      setSelectedWord(existing);
    } else {
      // Create new word from synonym
      const newWord: VocabularyWord = {
        id: Date.now().toString(),
        word: synonym,
        definition: 'Loading definition...',
        context: `Synonym of ${selectedWord?.word || 'unknown'}`,
        addedAt: Date.now()
      };
      
      handleSaveWord(newWord);
      setSelectedWord(newWord);
    }
  };

  const deleteWord = (id: string) => {
    setVocab(prev => prev.filter(w => w.id !== id));
    if (selectedWord?.id === id) {
      setSelectedWord(null);
    }
  };

  const handleCreateScenario = async () => {
    if (!customTopic.trim()) return;
    setIsGenerating(true);
    try {
      const newScenario = await generateScenarioIdeas(customTopic);
      setIsCustomModalOpen(false);
      setCustomTopic('');
      // Trigger mode selection for the new scenario
      handleScenarioClick(newScenario);
    } catch (e) {
      alert("Failed to create scenario.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Profile Logic
  const handleSaveProfile = () => {
    setUserProfile(prev => ({ ...prev, name: editName, level: editLevel }));
    setIsEditingProfile(false);
  };

  const handleStartEditProfile = () => {
    setEditName(userProfile.name);
    setEditLevel(userProfile.level);
    setIsEditingProfile(true);
  };

  const handleClearData = () => {
    if(confirm("Are you sure you want to delete all progress? This cannot be undone.")) {
      setVocab(INITIAL_VOCAB);
      setSessions([]);
      setDailyActivity({});
      // Resetting profile but keeping user logged in, or log out?
      // Let's keep logged in but reset stats.
      setProfileView('main');
    }
  };

  const getGroupedSessions = () => {
    const groups: { [key: string]: ConversationSession[] } = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    sessions.forEach(session => {
      const date = new Date(session.lastUpdated).toDateString();
      let key = date;
      if (date === today) key = 'Today';
      else if (date === yesterday) key = 'Yesterday';
      if (!groups[key]) groups[key] = [];
      groups[key].push(session);
    });
    return groups;
  };

  const getLast7DaysActivity = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W
      const seconds = dailyActivity[dateKey] || 0;
      days.push({ 
        label: dayLabel, 
        minutes: Math.round(seconds / 60),
        fullDate: dateKey
      });
    }
    return days;
  };

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // Render Main App
  const chartData = getLast7DaysActivity();
  const maxMinutes = Math.max(...chartData.map(d => d.minutes), 30); 

  if (currentSession) {
    return (
      <ChatInterface 
        key={currentSession.id}
        scenario={currentSession.scenario} 
        mode={currentSession.mode}
        initialMessages={currentSession.messages}
        onBack={() => setCurrentSession(null)}
        onSaveWord={handleSaveWord}
        onMessagesChange={handleUpdateCurrentSession}
        onReportProgress={handleReportProgress}
      />
    );
  }

  const TabButton = ({ id, icon, label }: { id: Tab; icon: React.ReactNode; label: string }) => (
    <button 
      onClick={() => { setActiveTab(id); setProfileView('main'); setSelectedWord(null); }}
      className={`flex flex-col items-center justify-center w-full py-2 transition-colors ${
        activeTab === id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <div className={`mb-1 transition-transform duration-200 ${activeTab === id ? 'scale-110' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
    </button>
  );

  return (
    <div className="h-[100dvh] w-full bg-slate-50 flex flex-col overflow-hidden max-w-md mx-auto shadow-2xl md:my-8 md:rounded-[3rem] md:h-[800px] md:border-8 md:border-slate-800 relative">
      
      <main className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50">
        
        {/* --- PRACTICE TAB --- */}
        {activeTab === 'practice' && (
          <div className="p-5 pb-24 relative min-h-full">
            <header className="flex justify-between items-center mb-6 mt-2 pt-safe">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">FluentAI</h1>
                <p className="text-slate-500 text-sm">Welcome back, {userProfile.name.split(' ')[0]}!</p>
              </div>
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5 bg-white text-orange-600 px-3 py-1.5 rounded-full border border-orange-100 shadow-sm">
                    <Flame size={18} className="fill-orange-500 text-orange-600" />
                    <span className="font-bold text-sm">3</span>
                 </div>
              </div>
            </header>

            <h3 className="font-bold text-slate-800 mb-3 px-1 flex items-center gap-2">
               <Sparkles size={16} className="text-indigo-500" />
               Daily Recommendations
            </h3>
            
            <ScenarioCarousel 
              scenarios={PREDEFINED_SCENARIOS} 
              onSelect={handleScenarioClick} 
            />

            <div className="flex items-center justify-between mb-4 mt-8 px-1">
              <h3 className="font-bold text-lg text-slate-800">Popular Scenarios</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {visibleScenarios.map((scenario) => (
                <div key={scenario.id} className="h-full">
                  <ScenarioCard 
                    scenario={scenario} 
                    onClick={() => handleScenarioClick(scenario)} 
                  />
                </div>
              ))}
            </div>

            <div ref={observerTarget} className="py-6 flex flex-col items-center justify-center text-slate-400">
               {isLoadingMore && (
                 <div className="flex items-center gap-2 text-indigo-500 text-sm font-medium">
                   <Loader2 size={20} className="animate-spin" />
                   <span>Loading more topics...</span>
                 </div>
               )}
            </div>

            <div className="fixed bottom-24 right-5 md:absolute md:bottom-24 md:right-5 z-40 pb-safe">
               <button 
                 onClick={() => setIsCustomModalOpen(true)}
                 className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-300 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2"
               >
                 <Plus size={24} />
                 <span className="font-bold pr-1">Create</span>
               </button>
            </div>
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === 'history' && (
          <div className="p-5 pb-24 h-full flex flex-col">
             <header className="mb-6 mt-2 sticky top-0 bg-slate-50 z-10 pb-2 pt-safe">
                <h1 className="text-2xl font-bold text-slate-800">History</h1>
                <p className="text-slate-500 text-sm">Your past conversations</p>
             </header>

             {sessions.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-slate-400 mt-10">
                 <Clock size={48} className="mb-4 opacity-20" />
                 <p>No history yet.</p>
                 <button onClick={() => setActiveTab('practice')} className="text-indigo-600 font-medium mt-2 hover:underline">Start a chat!</button>
               </div>
             ) : (
               <div className="space-y-6">
                 {Object.entries(getGroupedSessions()).map(([date, groupSessions]) => (
                   <div key={date}>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Calendar size={12} />
                        {date}
                      </h3>
                      <div className="relative border-l-2 border-slate-200 ml-2 pl-6 space-y-4">
                        {groupSessions.map((session) => (
                          <div 
                            key={session.id}
                            onClick={() => handleResumeSession(session)}
                            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-all cursor-pointer group relative"
                          >
                             <div className="absolute -left-[31px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-200 border-2 border-slate-50 group-hover:bg-indigo-500 transition-colors"></div>
                             
                             <div className="flex justify-between items-start mb-2">
                               <div className="flex items-center gap-2">
                                 <span className="text-2xl">{session.scenario.emoji}</span>
                                 <div>
                                   <div className="flex items-center gap-2">
                                     <h4 className="font-bold text-slate-800">{session.scenario.title}</h4>
                                     {session.mode === 'guided' && (
                                       <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">Challenge</span>
                                     )}
                                   </div>
                                   <span className="text-xs text-slate-400">
                                      {new Date(session.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                   </span>
                                 </div>
                               </div>
                               <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                             </div>
                             
                             <div className="text-sm text-slate-500 bg-slate-50 p-2 rounded-lg truncate">
                               {session.messages[session.messages.length - 1]?.text || "No messages yet"}
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        {/* --- VOCAB TAB --- */}
        {activeTab === 'vocab' && (
          selectedWord ? (
            <WordDetail 
              word={selectedWord} 
              onBack={() => setSelectedWord(null)} 
              onMastered={deleteWord} 
              onSynonymClick={handleSynonymClick}
            />
          ) : (
            <VocabBook 
              words={vocab} 
              onDelete={deleteWord} 
              onSelectWord={setSelectedWord}
            />
          )
        )}

        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && profileView === 'main' && (
          <div className="p-5 pb-24">
             <header className="mb-8 mt-2 flex justify-between items-center pt-safe">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
                </div>
                {!isEditingProfile && (
                  <button onClick={handleStartEditProfile} className="text-indigo-600 p-2 bg-indigo-50 rounded-full hover:bg-indigo-100 transition-colors">
                    <Edit2 size={18} />
                  </button>
                )}
             </header>

             <div className="flex flex-col items-center mb-8 relative">
               <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-4xl mb-3 border-4 border-white shadow-md">
                 {userProfile.avatar}
               </div>
               
               {isEditingProfile ? (
                 <div className="flex flex-col items-center gap-3 w-full max-w-xs animate-in fade-in slide-in-from-top-4 duration-300">
                   <input 
                     value={editName}
                     onChange={(e) => setEditName(e.target.value)}
                     className="text-center font-bold text-lg border-b-2 border-indigo-200 focus:border-indigo-600 outline-none bg-transparent w-full py-1 text-slate-800"
                     placeholder="Your Name"
                   />
                   <select 
                     value={editLevel}
                     onChange={(e) => setEditLevel(e.target.value)}
                     className="text-center text-sm text-slate-600 border rounded-lg px-2 py-1 bg-white"
                   >
                     <option value="Beginner">Beginner</option>
                     <option value="Intermediate">Intermediate</option>
                     <option value="Advanced">Advanced</option>
                   </select>
                   <div className="flex gap-2 mt-2">
                     <Button onClick={() => setIsEditingProfile(false)} variant="secondary" className="!py-1.5 !px-4 text-xs">Cancel</Button>
                     <Button onClick={handleSaveProfile} className="!py-1.5 !px-4 text-xs">Save</Button>
                   </div>
                 </div>
               ) : (
                 <>
                   <h2 className="text-xl font-bold text-slate-800">{userProfile.name}</h2>
                   <p className="text-slate-500 text-sm bg-slate-100 px-3 py-1 rounded-full mt-2">Level: {userProfile.level}</p>
                 </>
               )}
             </div>

             {/* Stats Grid */}
             <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                   <div className="text-orange-500 mb-1"><Flame size={20} /></div>
                   <div className="text-xl font-bold text-slate-800">3</div>
                   <div className="text-[10px] text-slate-500">Day Streak</div>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                   <div className="text-blue-500 mb-1"><Book size={20} /></div>
                   <div className="text-xl font-bold text-slate-800">{vocab.length}</div>
                   <div className="text-[10px] text-slate-500">Words</div>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                   <div className="text-emerald-500 mb-1"><MessageCircle size={20} /></div>
                   <div className="text-xl font-bold text-slate-800">{sessions.length}</div>
                   <div className="text-[10px] text-slate-500">Sessions</div>
                </div>
             </div>

             {/* Weekly Activity Chart */}
             <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-indigo-500" />
                  Weekly Activity (Last 7 Days)
                </h3>
                <div className="flex items-end justify-between h-24 gap-2">
                  {chartData.map((data, i) => {
                    const heightPercent = Math.max((data.minutes / maxMinutes) * 100, 5); // Min 5% height
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-default">
                         <div 
                           className="w-full bg-indigo-100 rounded-t-lg relative group-hover:bg-indigo-300 transition-all duration-500"
                           style={{ height: `${heightPercent}%` }}
                         >
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                             {data.minutes} min
                           </div>
                         </div>
                         <span className={`text-[10px] font-medium ${i === 6 ? 'text-indigo-600' : 'text-slate-400'}`}>
                           {data.label}
                         </span>
                      </div>
                    );
                  })}
                </div>
             </div>

             <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button 
                  onClick={() => setProfileView('achievements')}
                  className="w-full p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                >
                   <div className="flex items-center gap-3">
                     <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600 group-hover:scale-110 transition-transform">
                       <Trophy size={18} />
                     </div>
                     <span className="font-medium text-slate-700">Achievements</span>
                   </div>
                   <ChevronRight size={18} className="text-slate-300" />
                </button>
                <button 
                  onClick={() => setProfileView('settings')}
                  className="w-full p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                >
                   <div className="flex items-center gap-3">
                     <div className="bg-slate-100 p-2 rounded-lg text-slate-600 group-hover:scale-110 transition-transform">
                       <Settings size={18} />
                     </div>
                     <span className="font-medium text-slate-700">Settings</span>
                   </div>
                   <ChevronRight size={18} className="text-slate-300" />
                </button>
             </div>
          </div>
        )}

        {/* --- ACHIEVEMENTS SUB-VIEW --- */}
        {activeTab === 'profile' && profileView === 'achievements' && (
          <div className="p-5 pb-24 h-full flex flex-col">
            <header className="mb-6 mt-2 flex items-center gap-3 pt-safe">
              <button onClick={() => setProfileView('main')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ChevronRight size={20} className="rotate-180 text-slate-600" />
              </button>
              <h1 className="text-xl font-bold text-slate-800">Achievements</h1>
            </header>
            
            <div className="space-y-4">
               {[
                 { title: 'First Steps', desc: 'Complete your first conversation', icon: <Medal size={24} />, unlocked: sessions.length > 0, color: 'text-blue-500 bg-blue-100' },
                 { title: 'Word Collector', desc: 'Save 5 vocabulary words', icon: <Book size={24} />, unlocked: vocab.length >= 5, color: 'text-purple-500 bg-purple-100' },
                 { title: 'Chatterbox', desc: 'Complete 10 conversations', icon: <MessageCircle size={24} />, unlocked: sessions.length >= 10, color: 'text-indigo-500 bg-indigo-100' },
                 { title: 'Consistency is Key', desc: 'Reach a 3-day streak', icon: <Flame size={24} />, unlocked: true, color: 'text-orange-500 bg-orange-100' },
                 { title: 'Master Mind', desc: 'Master 20 words', icon: <Target size={24} />, unlocked: false, color: 'text-emerald-500 bg-emerald-100' },
               ].map((achievement, i) => (
                 <div key={i} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${achievement.unlocked ? 'bg-white border-slate-100 shadow-sm opacity-100' : 'bg-slate-50 border-slate-100 opacity-60 grayscale'}`}>
                    <div className={`p-3 rounded-full ${achievement.color} shrink-0`}>
                      {achievement.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{achievement.title}</h3>
                      <p className="text-xs text-slate-500">{achievement.desc}</p>
                    </div>
                    {achievement.unlocked && <div className="ml-auto text-yellow-500"><Trophy size={16} /></div>}
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* --- SETTINGS SUB-VIEW --- */}
        {activeTab === 'profile' && profileView === 'settings' && (
          <div className="p-5 pb-24 h-full flex flex-col">
            <header className="mb-6 mt-2 flex items-center gap-3 pt-safe">
              <button onClick={() => setProfileView('main')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ChevronRight size={20} className="rotate-180 text-slate-600" />
              </button>
              <h1 className="text-xl font-bold text-slate-800">Settings</h1>
            </header>

            <div className="space-y-6">
               <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                 <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                   <span className="font-medium text-slate-700">Native Language</span>
                   <span className="text-slate-500 text-sm">Chinese (Simplified)</span>
                 </div>
                 <div className="p-4 flex justify-between items-center">
                   <span className="font-medium text-slate-700">Learning Goal</span>
                   <span className="text-slate-500 text-sm">Travel & Daily Life</span>
                 </div>
               </div>

               <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                 <button className="w-full p-4 text-left text-slate-700 font-medium hover:bg-slate-50 flex justify-between">
                    About FluentAI <span className="text-slate-400 text-sm">v1.0.0</span>
                 </button>
                 <button className="w-full p-4 text-left text-slate-700 font-medium hover:bg-slate-50 border-t border-slate-50">
                    Privacy Policy
                 </button>
               </div>

               {/* Log Out Button */}
               <button 
                 onClick={handleLogout}
                 className="w-full bg-slate-100 text-slate-700 font-medium p-4 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
               >
                 <LogOut size={18} />
                 Log Out
               </button>

               {/* Clear Data Button */}
               <button 
                 onClick={handleClearData}
                 className="w-full bg-red-50 text-red-600 font-medium p-4 rounded-2xl border border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
               >
                 <X size={18} />
                 Reset All Progress
               </button>
               
               <p className="text-center text-xs text-slate-400 px-4">
                 Logging out keeps your data on this device. Resetting progress deletes everything.
               </p>
            </div>
          </div>
        )}

      </main>

      <nav className="bg-white border-t border-slate-100 px-6 pb-safe pt-2 flex justify-between items-center z-50 h-[70px] shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <TabButton id="practice" icon={<MessageCircle size={24} strokeWidth={activeTab === 'practice' ? 2.5 : 2} />} label="Practice" />
        <TabButton id="history" icon={<Clock size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />} label="History" />
        <TabButton id="vocab" icon={<Book size={24} strokeWidth={activeTab === 'vocab' ? 2.5 : 2} />} label="Vocabulary" />
        <TabButton id="profile" icon={<User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />} label="Profile" />
      </nav>

      {/* Mode Selection Modal */}
      {isModeSelectionOpen && selectedScenarioForMode && (
         <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800">Choose Mode</h3>
               <button onClick={() => setIsModeSelectionOpen(false)} className="bg-slate-100 p-1.5 rounded-full text-slate-500 hover:bg-slate-200">
                 <X size={18} />
               </button>
             </div>
             
             <div className="space-y-3">
               <button 
                 onClick={() => handleStartScenario(selectedScenarioForMode, 'free')}
                 className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center gap-4 group text-left"
               >
                 <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                   <MessageCircle size={24} />
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800">Free Talk</h4>
                   <p className="text-xs text-slate-500 mt-1">Chat freely with the AI character. Good for fluency.</p>
                 </div>
               </button>

               <button 
                 onClick={() => handleStartScenario(selectedScenarioForMode, 'guided')}
                 className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-amber-500 hover:bg-amber-50 transition-all flex items-center gap-4 group text-left"
               >
                 <div className="bg-amber-100 text-amber-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                   <Languages size={24} />
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800">Translation Challenge</h4>
                   <p className="text-xs text-slate-500 mt-1">Translate specific Chinese tasks to English. Good for accuracy.</p>
                 </div>
               </button>
             </div>
           </div>
         </div>
      )}

      {/* Custom Scenario Modal */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-bold text-slate-800">New Scenario</h3>
               <button onClick={() => setIsCustomModalOpen(false)} className="bg-slate-100 p-1.5 rounded-full text-slate-500 hover:bg-slate-200">
                 <X size={18} />
               </button>
             </div>
             
             <p className="text-slate-500 text-sm mb-5 leading-relaxed">
               What specific situation do you want to practice?
             </p>

             <div className="space-y-4">
               <div>
                 <input 
                    type="text" 
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="e.g., Returning a shirt..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:outline-none font-medium"
                    autoFocus
                 />
               </div>

               <Button 
                 onClick={handleCreateScenario} 
                 disabled={!customTopic.trim() || isGenerating}
                 className="w-full py-3.5 rounded-xl text-base"
               >
                 {isGenerating ? (
                   <span className="flex items-center justify-center gap-2">
                     <Sparkles size={18} className="animate-spin" /> Generating...
                   </span>
                 ) : 'Create Scenario'}
               </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;