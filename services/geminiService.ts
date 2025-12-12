import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, Scenario, ChatMode } from "../types";

// Helper to initialize the client on demand.
const getAiClient = () => {
  // process.env.API_KEY is replaced by Vite at build time
  // Trim potential quotes or whitespace if the build process injected them weirdly
  const rawKey = process.env.API_KEY || "";
  const apiKey = rawKey.replace(/^['"]|['"]$/g, '').trim();
  
  // Check for empty or placeholder values
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    console.error("CRITICAL ERROR: API Key is missing.");
    throw new Error("API Key is missing. Please set API_KEY or VITE_API_KEY in your Vercel Environment Variables.");
  }

  // Debug log (masked)
  console.log(`[Gemini] Initializing client with key ending in ...${apiKey.slice(-4)}`);
  
  return new GoogleGenAI({ apiKey });
};

// Unified schema for both modes
const chatResponseSchema = {
  type: Type.OBJECT,
  properties: {
    correction: {
      type: Type.STRING,
      description: "Correct the user's grammar or phrasing if there are mistakes. If perfect, leave empty.",
    },
    explanation: {
      type: Type.STRING,
      description: "Briefly explain the grammar rule or why the correction is better. Keep it concise.",
    },
    referenceTranslation: {
      type: Type.STRING,
      description: "ONLY for 'guided' mode. The ideal/standard English translation of the required task. Provide this if the user had errors or was off-topic.",
    },
    roleplayResponse: {
      type: Type.STRING,
      description: "The natural response of the AI character in the roleplay.",
    },
    translation: {
      type: Type.STRING,
      description: "Chinese translation of the roleplayResponse.",
    },
    guidedTask: {
      type: Type.STRING,
      description: "ONLY for 'guided' mode. A specific Chinese sentence/task for the user to say next. E.g., '请告诉店员你想要不加糖的拿铁'.",
    },
    suggestedVocab: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          definition: { type: Type.STRING, description: "Short definition in context." }
        }
      },
      description: "Extract 1 or 2 difficult or useful words from the roleplayResponse for the user to learn."
    }
  },
  required: ["roleplayResponse", "translation"]
};

export const startGuidedSession = async (scenario: Scenario): Promise<ChatMessage> => {
  const ai = getAiClient();
  const prompt = `
    You are an English tutor setting up a "Translation Challenge" roleplay.
    Scenario: ${scenario.title}
    Role: ${scenario.aiRole}
    User Role: ${scenario.userRole}
    
    1. Introduce the scenario briefly in English.
    2. Give the user their FIRST specific task in Chinese (what they should say in English).
    
    Return JSON with:
    - roleplayResponse: The introduction.
    - translation: Chinese translation of intro.
    - guidedTask: The first Chinese task (e.g. "请问候店员并询问是否有座").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: chatResponseSchema,
        temperature: 0.7
      }
    });

    const text = response.text;
    if (!text) throw new Error("Received empty response from AI.");

    const data = JSON.parse(text);
    
    return {
      id: 'init-guided',
      role: 'ai',
      text: data.roleplayResponse,
      translation: data.translation,
      guidedTask: data.guidedTask
    };
  } catch (error) {
    console.error("Gemini Guided Session Init Error:", error);
    throw error;
  }
};

export const generateTeacherResponse = async (
  history: ChatMessage[],
  userMessage: string,
  scenario: Scenario,
  mode: ChatMode
): Promise<any> => {
  const ai = getAiClient();
  let systemInstruction = '';

  if (mode === 'free') {
    systemInstruction = `
      You are an expert English tutor conducting a free-flow roleplay.
      Scenario: ${scenario.title} (${scenario.aiRole} vs ${scenario.userRole}).
      
      1. Analyze user's grammar/naturalness. Correct if needed.
      2. Respond naturally as ${scenario.aiRole}.
      3. Provide Chinese translation.
      4. Suggest vocabulary.
    `;
  } else {
    // Guided Mode
    systemInstruction = `
      You are an English tutor conducting a "Translation Challenge".
      Scenario: ${scenario.title}.
      
      The user was given a specific task in Chinese to say in English (found in the last AI message's guidedTask).
      
      Your analysis steps:
      1. **Check Compliance**: Did the user's English input match the meaning of the required Chinese task?
         - If NO (Off-topic/Wrong meaning): You must flag this.
         - If YES: Check for grammar/pronunciation/naturalness errors.
         
      2. **Feedback Generation**:
         - **correction**: 
           - If there are errors: Provide the corrected version of the user's sentence.
           - If off-topic: Provide the **Ideal English Translation** of the task.
           - If perfect: Leave empty.
         - **explanation**: Explain the mistake or note that they didn't follow the task.
         - **referenceTranslation**: ALWAYS provide the "Standard Answer" (Ideal English Translation of the task) if the user made ANY mistake or was off-topic.
         
      3. **Roleplay**:
         - **roleplayResponse**: Respond naturally as ${scenario.aiRole}. Even if the user made a mistake, try to keep the conversation flowing if possible, or gently ask for clarification.
         
      4. **Next Step**:
         - **guidedTask**: Set a NEW, different task in Chinese for the user's NEXT turn. Ensure it flows logically.
    `;
  }

  try {
    // Construct history for context
    const promptHistory = history.slice(-6).map(msg => 
      `${msg.role === 'user' ? 'User' : `AI (${scenario.aiRole})`}: ${msg.text} ${msg.guidedTask ? `[Task given: ${msg.guidedTask}]` : ''}`
    ).join('\n');

    const prompt = `
      ${promptHistory}
      User: ${userMessage}
      
      Respond as AI (${scenario.aiRole}).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: chatResponseSchema,
        temperature: 0.7
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text content in AI response.");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Response Generation Error:", error);
    throw error;
  }
};

export const generateScenarioIdeas = async (topic: string): Promise<Scenario> => {
   const ai = getAiClient();
   try {
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a roleplay scenario based on this topic: "${topic}". Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            emoji: { type: Type.STRING },
            aiRole: { type: Type.STRING },
            userRole: { type: Type.STRING },
            initialMessage: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] }
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response for scenario generation");

    const data = JSON.parse(text);
    return {
      id: `custom-${Date.now()}`,
      ...data
    };
   } catch (error) {
     console.error("Scenario Generation Error:", error);
     throw error;
   }
}

export const lookupVocabulary = async (word: string, context: string): Promise<any> => {
  const ai = getAiClient();
  const prompt = `
    Provide a detailed dictionary entry for the word: "${word}".
    Context where it appeared: "${context}".
    
    Return JSON with:
    - phonetic: IPA pronunciation (e.g. /əˈplɔːz/)
    - partOfSpeech: e.g. "n.", "v.", "adj."
    - chineseDefinition: The Chinese meaning relevant to the context.
    - exampleSentence: An English example sentence (use the context if good, or generate a better one).
    - exampleTranslation: Chinese translation of the example sentence.
    - roots: Brief etymology or memory aid (e.g. "ap + plause = ...")
    - synonyms: Array of 3-4 similar words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            phonetic: { type: Type.STRING },
            partOfSpeech: { type: Type.STRING },
            chineseDefinition: { type: Type.STRING },
            exampleSentence: { type: Type.STRING },
            exampleTranslation: { type: Type.STRING },
            roots: { type: Type.STRING },
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) return {};

    return JSON.parse(text);
  } catch (error) {
    console.error("Vocab lookup failed", error);
    // Return empty object instead of throwing to prevent crashing the whole word save flow
    return {};
  }
};