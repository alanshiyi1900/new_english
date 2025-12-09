// Simple wrapper for Web Speech API

// Types for SpeechRecognition (since it's not in standard TS lib by default sometimes)
interface IWindow extends Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
}

export const startListening = (
  onResult: (text: string) => void,
  onEnd: () => void,
  onError: (error: string) => void
) => {
  const windowObj = window as unknown as IWindow;
  const SpeechRecognition = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError("Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    if (event.results.length > 0) {
      const text = event.results[0][0].transcript;
      onResult(text);
    }
  };

  recognition.onspeechend = () => {
    recognition.stop();
  };

  recognition.onend = () => {
    onEnd();
  };

  recognition.onerror = (event: any) => {
    let message = 'An error occurred with speech recognition.';
    
    switch (event.error) {
      case 'not-allowed':
      case 'permission-denied':
        message = 'Microphone permission denied. Please go to your browser settings and allow microphone access for this site.';
        break;
      case 'no-speech':
        message = 'No speech detected. Please try again and speak closer to the microphone.';
        break;
      case 'network':
        message = 'Network error. Speech recognition requires an active internet connection.';
        break;
      case 'aborted':
        return; // Ignore aborted errors usually caused by stopping manually
      default:
        message = `Speech recognition error: ${event.error}`;
    }
    
    onError(message);
  };

  try {
    recognition.start();
  } catch (e) {
    console.error("Speech recognition start failed:", e);
    onError("Failed to start microphone. Please refresh the page and try again.");
    return null;
  }
  
  return recognition;
};

export const speakText = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  
  // Cancel any ongoing speech to prevent queue buildup
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1; // Normal speed
  utterance.pitch = 1;

  // Try to find a high-quality English voice
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || 
                       voices.find(v => v.lang === 'en-US' && !v.name.includes('Google')) ||
                       voices.find(v => v.lang.startsWith('en'));
  
  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  window.speechSynthesis.speak(utterance);
};