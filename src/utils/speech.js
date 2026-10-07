import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Speech-to-text.
//  - Web: the browser's Web Speech API (Chrome, Edge, Safari).
//  - Android / iOS: the expo-speech-recognition native module. It is not part of Expo Go,
//    so it only exists in a development build; without it the mic button is hidden.
let NativeSpeech = null;
if (Platform.OS !== 'web') {
  try {
    NativeSpeech = require('expo-speech-recognition').ExpoSpeechRecognitionModule;
    // Present in the JS bundle but missing in the running binary (e.g. Expo Go).
    if (!NativeSpeech || typeof NativeSpeech.start !== 'function') NativeSpeech = null;
  } catch (error) {
    NativeSpeech = null;
  }
}

const getWebRecognitionClass = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const NO_SPEECH_MESSAGE = "Didn't catch that. Tap the mic and try again.";
const BLOCKED_MESSAGE = 'Microphone access is blocked. Allow it in your settings.';

// `onTranscript(text, isFinal)` is called as words are recognised.
export function useSpeechInput(onTranscript) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const callbackRef = useRef(onTranscript);
  callbackRef.current = onTranscript;

  const isSupported = Boolean(NativeSpeech) || Boolean(getWebRecognitionClass());

  // Native: subscribe to the module's events for the lifetime of the component.
  useEffect(() => {
    if (!NativeSpeech) return undefined;
    const subscriptions = [
      NativeSpeech.addListener('result', (event) => {
        const transcript = event.results?.[0]?.transcript ?? '';
        callbackRef.current(transcript.trim(), Boolean(event.isFinal));
      }),
      NativeSpeech.addListener('error', (event) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError(BLOCKED_MESSAGE);
        } else if (event.error === 'no-speech' || event.error === 'speech-timeout') {
          setError(NO_SPEECH_MESSAGE);
        } else if (event.error !== 'aborted') {
          setError('Voice input failed. Please try again.');
        }
      }),
      NativeSpeech.addListener('end', () => setIsListening(false)),
    ];
    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      NativeSpeech.abort();
    };
  }, []);

  const stop = useCallback(() => {
    if (NativeSpeech) NativeSpeech.stop();
    else recognitionRef.current?.stop();
  }, []);

  const start = useCallback(async () => {
    setError('');

    if (NativeSpeech) {
      const permission = await NativeSpeech.requestPermissionsAsync();
      if (!permission.granted) {
        setError(BLOCKED_MESSAGE);
        return;
      }
      setIsListening(true);
      NativeSpeech.start({ lang: 'en-US', interimResults: true, continuous: false });
      return;
    }

    const Recognition = getWebRecognitionClass();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let transcript = '';
      let isFinal = false;
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
        isFinal = event.results[index].isFinal;
      }
      callbackRef.current(transcript.trim(), isFinal);
    };
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError(BLOCKED_MESSAGE);
      } else if (event.error === 'no-speech') {
        setError(NO_SPEECH_MESSAGE);
      } else if (event.error !== 'aborted') {
        setError('Voice input failed. Please try again.');
      }
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, []);

  // Never leave the microphone open after the component goes away.
  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { isSupported, isListening, error, start, stop };
}
