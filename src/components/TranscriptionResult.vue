<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTranscriptionStore, ANALYSIS_TYPES } from '../stores/transcription';
import { useToast } from 'vue-toast-notification';

const store = useTranscriptionStore();
const $toast = useToast();
const currentTime = ref(0);
const showAnalysisSelector = ref(false);
const activeTab = ref('transcript');

const isTranscriptionReady = computed(() => {
  return store.transcriptionResult?.utterances?.length > 0;
});

const formattedTranscript = computed(() => {
  if (!isTranscriptionReady.value) return [];
  return store.transcriptionResult.utterances.map(utterance => ({
    speaker: `Speaker ${utterance.speaker}`,
    text: utterance.text,
    confidence: utterance.confidence,
    timestamp: utterance.start,
    end: utterance.end,
    formattedTime: new Date(utterance.start).toISOString().substr(11, 8)
  }));
});

const chapters = computed(() => store.transcriptionResult?.chapters || []);
const keyPhrases = computed(() => store.transcriptionResult?.auto_highlights_result?.results || []);

const handleTimeClick = (timestamp: number) => {
  emit('seekTime', timestamp);
};

const isCurrentSegment = (start: number, end: number) => {
  return currentTime.value >= start && currentTime.value <= end;
};

const updateTime = (time: number) => {
  currentTime.value = time * 1000;
};

const toggleAnalysis = (label: string) => {
  const currentSelection = [...store.selectedAnalysis];
  const index = currentSelection.indexOf(label);

  if (index === -1) {
    currentSelection.push(label);
  } else {
    currentSelection.splice(index, 1);
  }

  store.setSelectedAnalysis(currentSelection);
};

const generateAnalysis = async () => {
  if (store.selectedAnalysis.length === 0) {
    $toast.error('Please select at least one analysis type');
    return;
  }

  store.setLoading(true);

  try {
    await store.fetchAnalysis(props.assemblyAiToken);
    $toast.success('Analysis generated successfully!');
    showAnalysisSelector.value = false;
  } catch (error) {
    console.error('Error generating analysis:', error);
    $toast.error('Failed to generate analysis');
  } finally {
    store.setLoading(false);
  }
};

const emit = defineEmits(['seekTime']);
const props = defineProps<{
  assemblyAiToken: string;
}>();

defineExpose({ updateTime });
</script>

<template>
  <div v-if="isTranscriptionReady" class="max-w-4xl mx-auto space-y-8">
    <!-- Navigation -->
    <nav class="flex space-x-4 bg-gray-900/50 p-2 rounded-xl">
      <button
        v-for="tab in ['transcript', 'analysis']"
        :key="tab"
        @click="activeTab = tab"
        class="px-4 py-2 rounded-lg transition-all duration-300"
        :class="activeTab === tab 
          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' 
          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'"
      >
        {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
      </button>
    </nav>

    <!-- Transcript Tab -->
    <div v-show="activeTab === 'transcript'" class="space-y-8">
      <!-- Key Phrases -->
      <div v-if="keyPhrases.length > 0" class="bg-gray-900/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-purple-500/20">
        <h2 class="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
          Key Phrases
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="phrase in keyPhrases"
            :key="phrase.text"
            class="p-4 rounded-xl bg-gray-800/50 border border-purple-500/20"
          >
            <h3 class="text-lg font-semibold text-indigo-300 mb-2">{{ phrase.text }}</h3>
            <div class="flex items-center justify-between text-sm text-gray-400">
              <span>Mentioned {{ phrase.count }} times</span>
              <span>Relevance: {{ Math.round(phrase.rank * 100) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Transcript -->
      <div class="bg-gray-900/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-purple-500/20">
        <h2 class="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
          Full Transcript
        </h2>
        <div class="space-y-4">
          <div
            v-for="(utterance, index) in formattedTranscript"
            :key="index"
            class="p-6 rounded-xl border transition-all duration-300 cursor-pointer"
            :class="[
              isCurrentSegment(utterance.timestamp, utterance.end)
                ? 'bg-purple-900/30 border-purple-500/50'
                : 'bg-gray-800/50 border-purple-500/10 hover:border-purple-500/30'
            ]"
            @click="handleTimeClick(utterance.timestamp)"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <span class="font-semibold text-indigo-300">{{ utterance.speaker }}</span>
              </div>
              <time class="text-sm text-gray-400">{{ utterance.formattedTime }}</time>
            </div>
            <p class="text-gray-300 leading-relaxed">{{ utterance.text }}</p>
            <div class="mt-2 text-sm text-gray-500">
              Confidence: {{ Math.round(utterance.confidence * 100) }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Analysis Tab -->
    <div v-show="activeTab === 'analysis'" class="space-y-8">
      <div class="bg-gray-900/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-purple-500/20">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
            Content Analysis
          </h2>
          <button
            @click="showAnalysisSelector = !showAnalysisSelector"
            class="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300"
          >
            {{ showAnalysisSelector ? 'Hide Options' : 'Generate Analysis' }}
          </button>
        </div>

        <!-- Analysis Selection -->
        <div v-if="showAnalysisSelector" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="type in ANALYSIS_TYPES"
              :key="type.label"
              @click="toggleAnalysis(type.label)"
              class="p-4 rounded-xl border cursor-pointer transition-all duration-300"
              :class="[
                store.selectedAnalysis.includes(type.label)
                  ? 'bg-purple-900/30 border-purple-500/50'
                  : 'bg-gray-800/50 border-purple-500/10 hover:border-purple-500/30'
              ]"
            >
              <h3 class="text-lg font-semibold text-indigo-300 mb-2">{{ type.label }}</h3>
              <p class="text-sm text-gray-400">{{ type.prompt }}</p>
            </div>
          </div>

          <button
            @click="generateAnalysis"
            class="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold"
            :disabled="store.loading"
          >
            <span v-if="store.loading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Analysis...
            </span>
            <span v-else>Generate Analysis</span>
          </button>
        </div>

        <!-- Key Moments -->
        <div v-if="chapters.length > 0" class="mt-8">
          <h2 class="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
            Key Moments
          </h2>
          <div class="space-y-4">
            <div 
              v-for="chapter in chapters" 
              :key="chapter.start"
              class="p-6 rounded-xl border transition-all duration-300 cursor-pointer"
              :class="[
                isCurrentSegment(chapter.start, chapter.end)
                  ? 'bg-purple-900/30 border-purple-500/50'
                  : 'bg-gray-800/50 border-purple-500/10 hover:border-purple-500/30'
              ]"
              @click="handleTimeClick(chapter.start)"
            >
              <h4 class="text-lg font-semibold text-indigo-300 mb-2">{{ chapter.headline }}</h4>
              <p class="text-gray-300 mb-3 leading-relaxed">{{ chapter.summary }}</p>
              <div class="flex items-center text-sm text-gray-400">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ new Date(chapter.start).toISOString().substr(11, 8) }} - 
                {{ new Date(chapter.end).toISOString().substr(11, 8) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>