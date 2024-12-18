<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useTranscriptionStore } from '../stores/transcription';
import AudioVisualizer from './AudioVisualizer.vue';
import TranscriptionResult from './TranscriptionResult.vue';
import { useToast } from 'vue-toast-notification';

const props = defineProps<{
  assemblyAiToken: string;
}>();

const store = useTranscriptionStore();
const $toast = useToast();
const mediaRecorder = ref<MediaRecorder | null>(null);
const isRecording = ref(false);
const audioChunks = ref<Blob[]>([]);
const selectedFile = ref<File | null>(null);
const currentAudioBlob = ref<Blob | null>(null);
const visualizerRef = ref();
const transcriptionRef = ref();

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.value = new MediaRecorder(stream);
    audioChunks.value = [];

    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.value.push(event.data);
    };

    mediaRecorder.value.onstop = () => {
      const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' });
      currentAudioBlob.value = audioBlob;
      uploadAudio(audioBlob);
    };

    mediaRecorder.value.start();
    isRecording.value = true;
  } catch (error) {
    console.error('Error accessing microphone:', error);
    $toast.error('Failed to access microphone. Please check your permissions.');
  }
};

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop();
    isRecording.value = false;
    mediaRecorder.value.stream.getTracks().forEach(track => track.stop());
  }
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
    currentAudioBlob.value = target.files[0];
    uploadAudio(target.files[0]);
  }
};

const loadSampleAudio = async () => {
  try {
    $toast.info('Loading sample audio...');
    const response = await fetch('https://raw.githubusercontent.com/realhood/Assembla/main/public/sample/147849__clairekearns__conversation-ii.mp3');
    if (!response.ok) throw new Error('Failed to fetch sample audio');
    
    const blob = await response.blob();
    currentAudioBlob.value = blob;
    uploadAudio(blob);
  } catch (error) {
    console.error('Error loading sample audio:', error);
    $toast.error('Failed to load sample audio. Please try again.');
  }
};

const uploadAudio = async (audioBlob: Blob) => {
  try {
    store.setLoading(true);
    $toast.info('Uploading audio...');
    
    // Convert blob to array buffer for upload
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    const uploadResponse = await axios.post(
      'https://api.assemblyai.com/v2/upload',
      arrayBuffer,
      {
        headers: {
          'authorization': props.assemblyAiToken,
          'content-type': 'application/octet-stream',
        }
      }
    );

    $toast.success('Audio uploaded successfully. Starting transcription...');

    const transcriptionResponse = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      {
        audio_url: uploadResponse.data.upload_url,
        speaker_labels: true,
        auto_chapters: true,
        auto_highlights: true
      },
      {
        headers: {
          'authorization': props.assemblyAiToken,
          'content-type': 'application/json',
        }
      }
    );

    store.setTranscriptionId(transcriptionResponse.data.id);
    checkTranscriptionStatus();
  } catch (error) {
    console.error('Error uploading audio:', error);
    store.setLoading(false);
    $toast.error('Failed to upload audio. Please try again.');
  }
};

const checkTranscriptionStatus = async () => {
  try {
    const response = await axios.get(
      `https://api.assemblyai.com/v2/transcript/${store.transcriptionId}`,
      {
        headers: {
          'authorization': props.assemblyAiToken,
        }
      }
    );

    if (response.data.status === 'completed') {
      store.setTranscriptionResult(response.data);
      store.setLoading(false);
      $toast.success('Transcription completed!');
    } else if (response.data.status === 'error') {
      store.setLoading(false);
      $toast.error('Transcription failed. Please try again.');
      throw new Error('Transcription failed');
    } else {
      setTimeout(checkTranscriptionStatus, 3000);
    }
  } catch (error) {
    console.error('Error checking transcription status:', error);
    store.setLoading(false);
  }
};

const handleTimeUpdate = (time: number) => {
  if (transcriptionRef.value) {
    transcriptionRef.value.updateTime(time);
  }
};

const handleSeekTime = (time: number) => {
  if (visualizerRef.value) {
    visualizerRef.value.seekTo(time);
  }
};
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <div class="bg-gray-900/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-purple-500/20">
      <div class="space-y-8">
        <div class="flex justify-center space-x-4">
          <button
            @click="isRecording ? stopRecording() : startRecording()"
            class="px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            :class="isRecording 
              ? 'bg-red-500/90 hover:bg-red-600' 
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'"
          >
            <span class="flex items-center space-x-2">
              <span v-if="isRecording" class="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              {{ isRecording ? 'Stop Recording' : 'Start Recording' }}
            </span>
          </button>
        </div>

        <div class="text-center">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-700"></div>
            </div>
            <div class="relative flex justify-center">
              <span class="px-4 bg-gray-900 text-gray-400 text-sm">or</span>
            </div>
          </div>

          <div class="mt-6 flex justify-center space-x-4">
            <label class="cursor-pointer inline-flex items-center px-6 py-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors duration-300 border border-gray-700 hover:border-purple-500/50">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Audio File
              <input
                type="file"
                accept="audio/*"
                class="hidden"
                @change="handleFileUpload"
              >
            </label>

            <button
              @click="loadSampleAudio"
              class="inline-flex items-center px-6 py-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors duration-300 border border-gray-700 hover:border-purple-500/50"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Try Sample Audio
            </button>
          </div>
        </div>

        <AudioVisualizer 
          v-if="currentAudioBlob"
          ref="visualizerRef"
          :audio-blob="currentAudioBlob"
          @time-update="handleTimeUpdate"
        />

        <div v-if="store.loading" class="text-center">
          <div class="inline-flex items-center px-4 py-2 bg-gray-800/50 rounded-lg">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500 mr-3"></div>
            <span class="text-gray-300">Processing your audio...</span>
          </div>
        </div>
      </div>
    </div>

    <TranscriptionResult 
      v-if="store.transcriptionResult"
      ref="transcriptionRef"
      :assembly-ai-token="assemblyAiToken"
      @seek-time="handleSeekTime"
    />
  </div>
</template>