import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { useWebSpeechRecognition } from './useWebSpeechRecognition';
import { useWhisperRecorder } from './useWhisperRecorder';

const LANGS = [
  { label: 'AR', web: 'ar-EG', whisper: 'ar' },
  { label: 'EN', web: 'en-US', whisper: 'en' }
];

/**
 * Reusable mic button with:
 * - Web Speech API live transcription when supported
 * - Whisper fallback (record + upload) otherwise
 *
 * Props:
 * - authFetch: (url, options) => fetch(...) with auth (required for Whisper fallback)
 * - disabled: disables button
 * - onText: ({ text, isFinal }) => void
 * - onState: ({ mode, isActive, isTranscribing }) => void
 * - onError: (message) => void
 */
export default function SpeechToTextButton({ authFetch, disabled, onText, onState, onError, stopSignal }) {
  const [lang, setLang] = useState(LANGS[0]);

  const web = useWebSpeechRecognition({ silenceMs: 3200 });
  const whisper = useWhisperRecorder({
    authFetch,
    language: lang.whisper,
    onText: (text) => onText?.({ text, isFinal: true })
  });

  const mode = useMemo(() => (web.isSupported ? 'webspeech' : 'whisper'), [web.isSupported]);
  const isActive = mode === 'webspeech' ? web.isListening : whisper.isRecording;
  const isTranscribing = mode === 'webspeech' ? false : whisper.isTranscribing;

  const onTextRef = useRef(onText);
  const onStateRef = useRef(onState);
  const onErrorRef = useRef(onError);

  const lastFinalRef = useRef('');

  useEffect(() => {
    onTextRef.current = onText;
    onStateRef.current = onState;
    onErrorRef.current = onError;
  }, [onError, onState, onText]);

  useEffect(() => {
    onStateRef.current?.({ mode, isActive, isTranscribing });
  }, [isActive, isTranscribing, mode]);

  useEffect(() => {
    if (stopSignal == null) return;
    if (!isActive) return;
    if (mode === 'webspeech') web.stop();
    else whisper.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopSignal]);

  useEffect(() => {
    const msg = web.error || whisper.error;
    if (msg) onErrorRef.current?.(msg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web.error, whisper.error]);

  useEffect(() => {
    if (mode !== 'webspeech') return;
    const finalText = String(web.finalText || '').trim();
    const interimText = String(web.interimText || '').trim();
    if (interimText) onTextRef.current?.({ text: `${finalText} ${interimText}`.trim(), isFinal: false });

    // Emit "final" only when it changes to avoid spamming parent.
    if (finalText && finalText !== lastFinalRef.current) {
      lastFinalRef.current = finalText;
      onTextRef.current?.({ text: finalText, isFinal: true });
    }
  }, [mode, web.finalText, web.interimText]);

  const toggle = async () => {
    if (disabled) return;
    if (isActive) {
      if (mode === 'webspeech') web.stop();
      else whisper.stop();
      return;
    }

    if (mode === 'webspeech') {
      lastFinalRef.current = '';
      web.start({ lang: lang.web });
      return;
    }

    // Whisper fallback: recording now, transcript will be returned by the server
    // after the recorder stops. We listen for the text by polling state changes:
    // - when recording stops AND not transcribing, we expect transcription to be done.
    await whisper.start();
  };

  const cycleLang = () => {
    setLang((prev) => (prev.label === 'AR' ? LANGS[1] : LANGS[0]));
  };

  return (
    <div className="stt-wrap">
      <button type="button" className="stt-lang" onClick={cycleLang} disabled={disabled || isActive} title="Speech language">
        {lang.label}
      </button>
      <button
        type="button"
        className="mic"
        onClick={toggle}
        disabled={disabled || isTranscribing}
        aria-label={isActive ? 'Stop recording' : 'Start recording'}
        title={mode === 'webspeech' ? 'Speech-to-text (live)' : 'Speech-to-text (upload)'}
      >
        {isActive ? <Square size={18} /> : <Mic size={18} />}
      </button>
    </div>
  );
}
