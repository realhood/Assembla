import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

export const ANALYSIS_TYPES = [
  {
    label: 'Quick Recap',
    prompt: 'Summarize the core ideas and main takeaways from the conversation in a concise and clear manner.'
  },
  {
    label: 'Purpose of the Conversation',
    prompt: 'Highlight the primary reason this conversation took place. Summarize the goal or intent behind it.'
  },
  {
    label: 'Big Wins and Agreements',
    prompt: 'Identify and summarize any key achievements, decisions, or agreements made during the discussion.'
  },
  {
    label: 'Challenges and Questions',
    prompt: 'List and summarize any challenges raised or questions asked during the conversation, along with how they were addressed.'
  },
  {
    label: 'Tone Check',
    prompt: 'Analyze the overall tone of the conversation. Was it collaborative, tense, formal, or casual? Summarize the mood and dynamics.'
  },
  {
    label: 'Action Plan',
    prompt: 'Summarize any next steps or follow-up tasks mentioned during the conversation. Focus on what needs to happen next and by whom.'
  },
  {
    label: 'Unfinished Business',
    prompt: 'Highlight any unresolved topics or issues discussed during the conversation that require future attention.'
  }
];

interface KeyPhrase {
  text: string;
  count: number;
  rank: number;
  timestamps: number[];
}

interface TranscriptionResult {
  text: string;
  utterances: Array<{
    speaker: string;
    text: string;
    confidence: number;
    start: number;
    end: number;
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

interface AnalysisResult {
  label: string;
  summary: string;
  timestamp: number;
  rawResponse?: {
    request_id: string;
    response: string;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}

export const useTranscriptionStore = defineStore('transcription', () => {
  const loading = ref(false);
  const transcriptionId = ref<string | null>(null);
  const transcriptionResult = ref<TranscriptionResult | null>(null);
  const selectedAnalysis = ref<string[]>([]);
  const analysisResults = ref<AnalysisResult[]>([]);
  const showAnalysisPopup = ref(false);
  const customPrompts = ref<string[]>([]);

  const setLoading = (value: boolean) => {
    loading.value = value;
  };

  const setTranscriptionId = (id: string) => {
    transcriptionId.value = id;
  };

  const setTranscriptionResult = (result: TranscriptionResult) => {
    transcriptionResult.value = result;
  };

  const setSelectedAnalysis = (analysis: string[]) => {
    selectedAnalysis.value = analysis;
  };

  const toggleAnalysisPopup = () => {
    showAnalysisPopup.value = !showAnalysisPopup.value;
  };

  const addCustomPrompt = (prompt: string) => {
    customPrompts.value.push(prompt);
  };

  const removeCustomPrompt = (index: number) => {
    customPrompts.value.splice(index, 1);
  };

  const fetchAnalysis = async (token: string) => {
    const selectedTypes = ANALYSIS_TYPES.filter(type => 
      selectedAnalysis.value.includes(type.label)
    );

    const prompts = [
      ...selectedTypes.map(type => `${type.label}:\n${type.prompt}`),
      ...customPrompts.value.map((prompt, index) => `Custom Analysis ${index + 1}:\n${prompt}`)
    ];

    const combinedPrompt = prompts.join('\n\n');

    try {
      const response = await axios.post(
        'https://api.assemblyai.com/lemur/v3/generate/summary',
        {
          transcript_ids: [transcriptionId.value],
          final_model: 'anthropic/claude-3-sonnet',
          prompt: combinedPrompt,
          answer_format: "Provide analysis for each section with clear section titles.",
          temperature: 0.3
        },
        {
          headers: {
            'authorization': token,
            'content-type': 'application/json',
          }
        }
      );

      if (response.data) {
        const sections = response.data.response.split(/(?=\n[A-Za-z\s]+:)/);
        const results: AnalysisResult[] = sections
          .filter(section => section.trim())
          .map(section => {
            const titleMatch = section.match(/^[\n\s]*([^:]+):/);
            const label = titleMatch ? titleMatch[1].trim() : 'Analysis';
            const summary = section.replace(/^[\n\s]*[^:]+:/, '').trim();
            
            return {
              label,
              summary,
              timestamp: Date.now(),
              rawResponse: response.data
            };
          });

        analysisResults.value = results;
        showAnalysisPopup.value = true;
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      throw error;
    }
  };

  return {
    loading,
    transcriptionId,
    transcriptionResult,
    selectedAnalysis,
    analysisResults,
    showAnalysisPopup,
    customPrompts,
    setLoading,
    setTranscriptionId,
    setTranscriptionResult,
    setSelectedAnalysis,
    fetchAnalysis,
    toggleAnalysisPopup,
    addCustomPrompt,
    removeCustomPrompt
  };
});