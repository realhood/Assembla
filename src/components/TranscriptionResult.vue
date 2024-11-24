<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTranscriptionStore } from '../stores/transcription';

const store = useTranscriptionStore();
const currentTime = ref(0);

const formattedTranscript = computed(() => {
  if (!store.transcriptionResult) return [];
  
  return store.transcriptionResult.utterances?.map(utterance => ({
    speaker: `Speaker ${utterance.speaker}`,
    text: utterance.text,
    confidence: utterance.confidence,
    timestamp: utterance.start,
    end: utterance.end,
    formattedTime: new Date(utterance.start).toISOString().substr(11, 8)
  }));
});

const chapters = computed(() => {
  return store.transcriptionResult?.chapters || [];
});

const handleTimeClick = (timestamp: number) => {
  emit('seekTime', timestamp);
};

const isCurrentSegment = (start: number, end: number) => {
  return currentTime.value >= start && currentTime.value <= end;
};

const updateTime = (time: number) => {
  currentTime.value = time * 1000; // Convert to milliseconds to match timestamps
};

const emit = defineEmits(['seekTime']);
defineExpose({ updateTime });
</script>

<template>
  <div v-if="store.transcriptionResult" class="max-w-4xl mx-auto space-y-8">
    <!-- Chapters/Summary -->
    <div class="bg-gray-900/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-purple-500/20">
      <h2 class="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
        Key Moments
      </h2>
      <div class="space-y-6">
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
          <h3 class="text-xl font-semibold text-indigo-300 mb-2">{{ chapter.headline }}</h3>
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

    <!-- Transcript -->
    <div class="bg-gray-900/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-purple-500/20">
      <h2 class="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
        Full Transcript
      </h2>
      <div class="space-y-6">
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
              <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="font-semibold text-indigo-300">{{ utterance.speaker }}</span>
            </div>
            <div class="flex items-center text-sm text-gray-400 hover:text-purple-400 transition-colors">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ utterance.formattedTime }}
            </div>
          </div>
          <p class="text-gray-300 leading-relaxed">{{ utterance.text }}</p>
          <div class="mt-2 text-sm text-gray-500">
            Confidence: {{ Math.round(utterance.confidence * 100) }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>