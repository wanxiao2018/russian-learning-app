/**
 * Russian TTS utility using Web Speech API
 * Selects the best available Russian voice
 */

let russianVoice = null;

function loadVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

async function getRussianVoice() {
  if (russianVoice) return russianVoice;
  
  const voices = await loadVoices();
  
  // Priority: Google Russian > Microsoft Milena > Any Russian voice
  const preferred = [
    'Google русский',
    'Google Russian',
    'Microsoft Milena',
    'Microsoft Irina',
    'Milena',
    'Irina',
  ];
  
  // First try preferred voices
  for (const name of preferred) {
    const voice = voices.find(v => v.name.includes(name));
    if (voice) {
      russianVoice = voice;
      return voice;
    }
  }
  
  // Then try any voice with ru-RU or ru locale
  const ruVoice = voices.find(v => v.lang.startsWith('ru'));
  if (ruVoice) {
    russianVoice = ruVoice;
    return ruVoice;
  }
  
  return null;
}

export async function speakRussian(text) {
  if (!text || !window.speechSynthesis) return;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ru-RU';
  utterance.rate = 0.85;  // Slightly slower for learning
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  const voice = await getRussianVoice();
  if (voice) {
    utterance.voice = voice;
  }
  
  window.speechSynthesis.speak(utterance);
}

export function getAvailableRussianVoices() {
  return loadVoices().then(voices => 
    voices.filter(v => v.lang.startsWith('ru'))
  );
}
