<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AudioRecorder from './components/AudioRecorder.vue';
import TranscriptionResult from './components/TranscriptionResult.vue';
import TokenInput from './components/TokenInput.vue';
import { useToast } from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

const $toast = useToast();
const token = ref('');
const isValidToken = ref(false);

const handleTokenSubmit = (newToken: string) => {
  token.value = newToken;
  isValidToken.value = true;
  $toast.success('Token saved successfully!');
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
        AI Voice Transcription
      </h1>

      <TokenInput 
        v-if="!isValidToken"
        @token-submit="handleTokenSubmit"
      />

      <div v-else class="space-y-8">
        <AudioRecorder :assembly-ai-token="token" />
        <TranscriptionResult />
      </div>
    </div>
  </div>
</template>