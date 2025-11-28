import { useMemo, useState, useRef, useCallback } from 'react';
import type { WhisperMode, WhisperSupportedLanguage } from '../services/OpenAIWhisperService';
import useAiDuxVoice from './useAiDuxVoice';

export type AssistantCategory =
  | 'medication'
  | 'tecartherapy'
  | 'modality'
  | 'exercise_safety'
  | 'flag_criteria'
  | 'rom_norms';

type AssistantInteractionType = 'clinical_info' | 'summary' | 'system';

export type AssistantInteraction = {
  id: string;
  type: AssistantInteractionType;
  timestamp: number;
  query: string;
  answer?: string;
  category?: AssistantCategory;
  error?: string | null;
};

interface UseAiDuxAssistantOptions {
  languagePreference: WhisperSupportedLanguage;
  transcript: string;
  resolveLanguage: () => 'en' | 'es' | 'fr';
  onSetMode: (mode: WhisperMode) => void;
  onStopTranscription: () => void;
  runSummary: (params: { transcript: string; language: 'en' | 'es' | 'fr' }) => Promise<string | null>;
  runClinicalInfoQuery: (params: {
    queryText: string;
    category: AssistantCategory;
    language: 'en' | 'es' | 'fr';
    context?: {
      medicationName?: string;
      conditionOrRegion?: string;
      modalityName?: string;
    };
  }) => Promise<{ answerText: string } | null>;
}

export const useAiDuxAssistant = ({
  languagePreference,
  transcript,
  resolveLanguage,
  onSetMode,
  onStopTranscription,
  runSummary,
  runClinicalInfoQuery,
}: UseAiDuxAssistantOptions) => {
  const [interactions, setInteractions] = useState<AssistantInteraction[]>([]);
  const [activeInteractionId, setActiveInteractionId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const pendingInteractionIdRef = useRef<string | null>(null);

  const addInteraction = useCallback((interaction: AssistantInteraction) => {
    setInteractions((prev) => [interaction, ...prev].slice(0, 10));
    setActiveInteractionId(interaction.id);
  }, []);

  const updateInteraction = useCallback((id: string, updates: Partial<AssistantInteraction>) => {
    setInteractions((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const currentInteraction = useMemo(
    () => interactions.find((item) => item.id === activeInteractionId) || null,
    [interactions, activeInteractionId]
  );

  const {
    isListening,
    isProcessing,
    error: voiceError,
    listenForCommand,
  } = useAiDuxVoice({
    languagePreference,
    onSetMode,
    onStopTranscription,
    onSummaryResult: (summary) => {
      const id = `summary-${Date.now()}`;
      addInteraction({
        id,
        type: 'summary',
        timestamp: Date.now(),
        query: 'Summarize current transcript',
        answer: summary,
      });
      setPanelOpen(true);
    },
    onClinicalInfoLoading: (category, query) => {
      const id = `clinical-${Date.now()}`;
      pendingInteractionIdRef.current = id;
      const interaction: AssistantInteraction = {
        id,
        type: 'clinical_info',
        timestamp: Date.now(),
        query,
        category,
      };
      addInteraction(interaction);
      setPanelOpen(true);
    },
    onClinicalInfoResult: ({ query, answer, category }) => {
      const pendingId = pendingInteractionIdRef.current;
      setInteractions((prev) => {
        let updated = prev;
        let targetId = pendingId;
        if (!targetId) {
          const existing = prev.find((item) => item.query === query && item.type === 'clinical_info');
          targetId = existing?.id ?? null;
        }

        if (!targetId) {
          const id = `clinical-${Date.now()}`;
          const interaction: AssistantInteraction = {
            id,
            type: 'clinical_info',
            timestamp: Date.now(),
            query,
            category,
            answer,
          };
          updated = [interaction, ...prev].slice(0, 10);
          setActiveInteractionId(interaction.id);
        } else {
          updated = prev.map((item) =>
            item.id === targetId
              ? { ...item, answer, error: null, category: category ?? item.category, query }
              : item
          );
          setActiveInteractionId(targetId);
        }
        pendingInteractionIdRef.current = null;
        return updated;
      });
      setPanelOpen(true);
    },
    onClinicalInfoError: (message) => {
      const pendingId = pendingInteractionIdRef.current;
      if (pendingId) {
        updateInteraction(pendingId, { error: message });
      }
      pendingInteractionIdRef.current = null;
    },
    runSummary: async () => {
      if (!transcript?.trim()) return null;
      const language = resolveLanguage();
      return runSummary({ transcript, language });
    },
    runClinicalInfoQuery: async ({ queryText, category, language, context }) => {
      const lang = language ?? resolveLanguage();
      return runClinicalInfoQuery({ queryText, category: category as AssistantCategory, language: lang, context });
    },
  });

  const speakGreeting = useCallback(
    (
      speech: SpeechSynthesisUtterance,
      locale: 'en-CA' | 'es-ES' | 'fr-CA'
    ) => {
      try {
        speech.lang = locale;
        speech.rate = 1;
        speech.pitch = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(speech);
      } catch (error) {
        console.warn('Speech synthesis failed', error);
      }
    },
    []
  );

  const greetIfNeeded = useCallback(async () => {
    if (hasGreeted) return;

    const language = resolveLanguage();
    const greetingMap: Record<'en' | 'es' | 'fr', { text: string; locale: 'en-CA' | 'es-ES' | 'fr-CA' }> = {
      en: { text: 'Hello! How can I support your session today?', locale: 'en-CA' },
      es: { text: 'Hola, ¿en qué te puedo ayudar hoy?', locale: 'es-ES' },
      fr: { text: 'Bonjour ! Comment puis-je vous aider aujourd’hui ?', locale: 'fr-CA' }
    };
    const greeting = greetingMap[language] ?? greetingMap.en;

    const id = `system-${Date.now()}`;
    const interaction: AssistantInteraction = {
      id,
      type: 'system',
      timestamp: Date.now(),
      query: greeting.text,
    };
    addInteraction(interaction);

    if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') {
      setHasGreeted(true);
      return;
    }

    await new Promise<void>((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(greeting.text);
        utterance.lang = greeting.locale;
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.warn('Speech synthesis failed', error);
        resolve();
      }
    });

    setHasGreeted(true);
  }, [addInteraction, hasGreeted, resolveLanguage]);

  const startVoiceInteraction = async () => {
    setPanelOpen(true);
    await greetIfNeeded();
    await listenForCommand();
  };

  const selectInteraction = (id: string) => {
    setActiveInteractionId(id);
    setPanelOpen(true);
  };

  const clearInteraction = useCallback((id: string) => {
    setInteractions((prev) => {
      const remaining = prev.filter((item) => item.id !== id);
      setActiveInteractionId((prevActive) => (prevActive === id ? remaining[0]?.id ?? null : prevActive));
      return remaining;
    });
  }, []);

  const assistantError = voiceError;

  return {
    isListening,
    isProcessing,
    assistantError,
    startVoiceInteraction,
    panelOpen,
    setPanelOpen,
    interactions,
    currentInteraction,
    selectInteraction,
    clearInteraction,
  };
};

export default useAiDuxAssistant;
