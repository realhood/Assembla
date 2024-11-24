<script setup lang="ts">
import { useTranscriptionStore } from '../stores/transcription';
import { ref } from 'vue';

const store = useTranscriptionStore();
const showRawResponse = ref(false);

const close = () => {
  store.toggleAnalysisPopup();
};

const toggleRawResponse = () => {
  showRawResponse.value = !showRawResponse.value;
};

const formatTokens = (tokens: number): string => {
  return tokens.toLocaleString();
};
</script>

<template>
  <div v-if="store.showAnalysisPopup" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" @click="close"></div>

    <!-- Modal -->
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div class="relative transform overflow-hidden rounded-2xl bg-gray-900 border border-purple-500/20 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
        <!-- Close button -->
        <div class="absolute right-0 top-0 pr-4 pt-4">
          <button
            type="button"
            class="rounded-md bg-transparent text-gray-400 hover:text-gray-200"
            @click="close"
          >
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="mt-3 sm:mt-5">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
              Analysis Results
            </h3>
            <button
              @click="toggleRawResponse"
              class="text-sm px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              {{ showRawResponse ? 'Show Analysis' : 'Show Raw Response' }}
            </button>
          </div>
          
          <div v-if="!showRawResponse" class="mt-4 max-h-[60vh] overflow-y-auto space-y-6 pr-2">
            <div
              v-for="result in store.analysisResults"
              :key="result.timestamp"
              class="bg-gray-800/50 rounded-xl p-6 border border-purple-500/20"
            >
              <h4 class="text-xl font-semibold text-indigo-300 mb-3">{{ result.label }}</h4>
              <p class="text-gray-300 whitespace-pre-line">{{ result.summary }}</p>
            </div>
          </div>

          <div v-else class="mt-4 max-h-[60vh] overflow-y-auto space-y-6 pr-2">
            <div class="bg-gray-800/50 rounded-xl p-6 border border-purple-500/20">
              <div class="mb-4">
                <h4 class="text-lg font-semibold text-indigo-300 mb-2">Request ID</h4>
                <code class="text-sm text-gray-300 font-mono">{{ store.analysisResults[0]?.rawResponse?.request_id }}</code>
              </div>

              <div class="mb-4">
                <h4 class="text-lg font-semibold text-indigo-300 mb-2">Token Usage</h4>
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-gray-900/50 p-4 rounded-lg">
                    <p class="text-sm text-gray-400">Input Tokens</p>
                    <p class="text-xl font-mono text-purple-400">
                      {{ formatTokens(store.analysisResults[0]?.rawResponse?.usage?.input_tokens || 0) }}
                    </p>
                  </div>
                  <div class="bg-gray-900/50 p-4 rounded-lg">
                    <p class="text-sm text-gray-400">Output Tokens</p>
                    <p class="text-xl font-mono text-indigo-400">
                      {{ formatTokens(store.analysisResults[0]?.rawResponse?.usage?.output_tokens || 0) }}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 class="text-lg font-semibold text-indigo-300 mb-2">Raw Response</h4>
                <pre class="text-sm text-gray-300 font-mono bg-gray-900/50 p-4 rounded-lg overflow-x-auto">{{ JSON.stringify(store.analysisResults[0]?.rawResponse, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-5 sm:mt-6">
          <button
            type="button"
            class="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl px-4 py-3 font-semibold text-white shadow-sm transition-all duration-300"
            @click="close"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>