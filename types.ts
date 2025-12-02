export type ChatMode = 'free' | 'guided';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  emoji: string;
  aiRole: string;
  userRole: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  initialMessage: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  definition: string;
  context: string; // The sentence where it appeared
  addedAt: number;
  // Rich data for dictionary card
  phonetic?: string;
  partOfSpeech?: string;
  chineseDefinition?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  synonyms?: string[];
  roots?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  // Fields specific to AI analysis
  correction?: string;
  explanation?: string;
  translation?: string;
  referenceTranslation?: string; // The ideal/standard English translation for the guided task
  suggestedVocab?: { word: string; definition: string }[];
  guidedTask?: string; // The instruction for the user in guided mode (e.g. "Translate: I want coffee")
  audioUrl?: string; // In a real app, this would point to the TTS file
}

export interface ConversationSession {
  id: string;
  scenario: Scenario;
  mode: ChatMode;
  messages: ChatMessage[];
  startTime: number;
  lastUpdated: number;
}

export interface AppState {
  currentScreen: 'dashboard' | 'chat' | 'vocab' | 'profile';
  activeScenario: Scenario | null;
  vocabulary: VocabularyWord[];
  completedScenarios: string[]; // IDs
}