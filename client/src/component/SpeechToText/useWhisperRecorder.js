import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * MediaRecorder-based audio capture + server transcription (Whisper).
 * No "live" transcripts, but provides a reliable fallback when Web Speech API isn't available.
 */
export function useWhisperRecorder({
  authFetch,
  endpoint = '/api/stt/transcribe',
  language = 'ar',
  maxRecordMs = 30000,
  onText
} = {}) {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const stopTimerRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState('');

  const clearStopTimer = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearStopTimer();
    try {
      mediaRecorderRef.current?.stop?.();
    } catch {
      // ignore
    }
  }, [clearStopTimer]);

  const start = useCallback(async () => {
    if (isRecording || isTranscribing) return false;
    setError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone is not supported in this browser.');
      return false;
    }
    if (!window.MediaRecorder) {
      setError('Audio recording is not supported in this browser.');
      return false;
    }
    if (!authFetch) {
      setError('Missing authFetch for transcription upload.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstart = () => setIsRecording(true);
      recorder.onstop = async () => {
        setIsRecording(false);
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        audioChunksRef.current = [];
        if (!blob.size) return;

        setIsTranscribing(true);
        try {
          const form = new FormData();
          form.append('audio', blob, 'audio.webm');
          form.append('language', language);
          const res = await authFetch(endpoint, { method: 'POST', body: form });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setError(data?.error || `Transcription failed (HTTP ${res.status}).`);
            return;
          }
          const text = String(data?.text || '').trim();
          if (text) onText?.(text);
        } catch (e) {
          setError(e?.message || 'Network error while transcribing.');
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      // Soft stop: prevents accidental long recordings in fallback mode.
      clearStopTimer();
      stopTimerRef.current = setTimeout(() => stop(), maxRecordMs);
      return true;
    } catch (e) {
      setError('Could not access microphone (check permissions).');
      return false;
    }
  }, [authFetch, clearStopTimer, endpoint, isRecording, isTranscribing, language, maxRecordMs, onText, stop]);

  useEffect(() => {
    return () => {
      clearStopTimer();
      try {
        mediaRecorderRef.current?.stop?.();
      } catch {
        // ignore
      }
    };
  }, [clearStopTimer]);

  return { isRecording, isTranscribing, error, start, stop };
}
