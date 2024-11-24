import { defineStore } from 'pinia';
import { ref } from 'vue';

interface KeyPhrase {
  text: string;
  count: number;
  rank: number;
}

interface TranscriptionResult {
  text: string;
  utterances: Array<{
    speaker: string;
    text: string;
    confidence: number;
    start: number;
  }>;
  chapters: Array<{
    headline: string;
    summary: string;
    start: number;
    end: number;
  }>;
  auto_highlights_result: {
    results: KeyPhrase[];
  };
}

export const useTranscriptionStore = defineStore('transcription', () => {
  const loading = ref(false);
  const transcriptionId = ref<string | null>(null);
  const transcriptionResult = ref<TranscriptionResult | null>(null);

  const setLoading = (value: boolean) => {
    loading.value = value;
  };

  const setTranscriptionId = (id: string) => {
    transcriptionId.value = id;
  };

  const setTranscriptionResult = (result: TranscriptionResult) => {
    transcriptionResult.value = result;
  };

  return {
    loading,
    transcriptionId,
    transcriptionResult,
    setLoading,
    setTranscriptionId,
    setTranscriptionResult,
  };
});