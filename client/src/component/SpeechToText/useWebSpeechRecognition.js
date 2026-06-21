import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Web Speech API (SpeechRecognition) wrapper with:
 * - interim (live) transcripts
 * - final transcripts
 * - silence auto-stop timer (reset on any result)
 */
export function useWebSpeechRecognition({ silenceMs = 3000 } = {}) {
  const SpeechRecognitionCtor = useMemo(() => getSpeechRecognitionCtor(), []);
  const isSupported = Boolean(SpeechRecognitionCtor);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const finalTextRef = useRef('');

  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [error, setError] = useState('');

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const armSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
    }, silenceMs);
  }, [clearSilenceTimer, silenceMs]);

  const stop = useCallback(() => {
    clearSilenceTimer();
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
  }, [clearSilenceTimer]);

  const start = useCallback(
    ({ lang = 'en-US' } = {}) => {
      if (!SpeechRecognitionCtor) {
        setError('Speech recognition is not supported in this browser.');
        return false;
      }
      if (isListening) return true;

      setError('');
      setInterimText('');
      setFinalText('');
      finalTextRef.current = '';

      const recognition = new SpeechRecognitionCtor();
      recognitionRef.current = recognition;

      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        armSilenceTimer();
      };

      recognition.onresult = (event) => {
        let nextInterim = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = String(result?.[0]?.transcript || '');
          if (result.isFinal) {
            finalTextRef.current = `${finalTextRef.current}${transcript}`;
          } else {
            nextInterim = transcript;
          }
        }
        setFinalText(finalTextRef.current);
        setInterimText(nextInterim);
        armSilenceTimer();
      };

      recognition.onerror = (e) => {
        const msg =
          e?.error === 'not-allowed'
            ? 'Microphone permission denied.'
            : e?.error === 'no-speech'
              ? 'No speech detected.'
              : e?.message || 'Speech recognition failed.';
        setError(msg);
      };

      recognition.onend = () => {
        clearSilenceTimer();
        setIsListening(false);
        setInterimText('');
        setFinalText(finalTextRef.current);
      };

      try {
        recognition.start();
        return true;
      } catch (e) {
        setError(e?.message || 'Speech recognition failed to start.');
        return false;
      }
    },
    [SpeechRecognitionCtor, armSilenceTimer, clearSilenceTimer, isListening]
  );

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
    };
  }, [clearSilenceTimer]);

  return {
    isSupported,
    isListening,
    interimText,
    finalText,
    error,
    start,
    stop
  };
}

